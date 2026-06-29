import type { Idea, IdeaComment, ThreadComment, ThreadItem, UserProfile } from './types';
import { createId, loadFromStorage, saveToStorage } from './storage';
import { isSupabaseEnabled, supabase } from './supabaseClient';

// Simple event emitter so pages can react to realtime updates
export const storeEventTarget = new EventTarget();
let _realtimeInitialized = false;

export function initRealtimeSubscriptions() {
  if (!supabase || _realtimeInitialized) return;
  _realtimeInitialized = true;

  const client = supabase;
  const subscribe = (table: string, eventName: string) => {
    client
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          storeEventTarget.dispatchEvent(new Event(eventName));
        },
      )
      .subscribe();
  };

  subscribe('ideas', 'ideasUpdated');
  subscribe('idea_comments', 'ideaCommentsUpdated');
  subscribe('threads', 'threadsUpdated');
  subscribe('thread_comments', 'threadCommentsUpdated');
}

const IDEAS_KEY = 'travebeta-ideas';
const IDEA_COMMENTS_KEY = 'travebeta-idea-comments';
const THREADS_KEY = 'travebeta-threads';
const THREAD_COMMENTS_KEY = 'travebeta-thread-comments';
const USER_KEY = 'travebeta-user';

const DEFAULT_IDEA_COLOR = '#3388ff';

function mapIdeaRow(row: any): Idea {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    posName: row.pos_name,
    mainTxt: row.main_txt,
    tags: Array.isArray(row.tags) ? row.tags : typeof row.tags === 'string' ? JSON.parse(row.tags) : [],
    color: row.color || DEFAULT_IDEA_COLOR,
    latitude: row.latitude,
    longitude: row.longitude,
    likes: row.likes ?? 0,
    createdAt: row.created_at,
  };
}

function mapIdeaCommentRow(row: any): IdeaComment {
  return {
    id: row.id,
    ideaId: row.idea_id,
    userId: row.user_id,
    userName: row.user_name,
    comTxt: row.com_txt,
    createdAt: row.created_at,
  };
}

function mapThreadRow(row: any): ThreadItem {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    title: row.title,
    createdAt: row.created_at,
  };
}

function mapThreadCommentRow(row: any): ThreadComment {
  return {
    id: row.id,
    threadId: row.thread_id,
    userId: row.user_id,
    userName: row.user_name,
    comTxt: row.com_txt,
    likes: row.likes ?? 0,
    createdAt: row.created_at,
  };
}

function loadIdeasLocal(): Idea[] {
  return loadFromStorage<Partial<Idea>[]>(IDEAS_KEY, []).map((idea) => ({
    id: idea.id ?? createId('idea'),
    userId: idea.userId ?? 'anonymous',
    userName: idea.userName ?? 'anonymous',
    posName: idea.posName ?? '',
    mainTxt: idea.mainTxt ?? '',
    tags: idea.tags ?? [],
    color: idea.color || DEFAULT_IDEA_COLOR,
    latitude: idea.latitude ?? 0,
    longitude: idea.longitude ?? 0,
    likes: idea.likes ?? 0,
    createdAt: idea.createdAt ?? new Date().toISOString(),
  }));
}

function saveIdeasLocal(ideas: Idea[]): void {
  saveToStorage(IDEAS_KEY, ideas);
}

function loadIdeaCommentsLocal(): IdeaComment[] {
  return loadFromStorage<IdeaComment[]>(IDEA_COMMENTS_KEY, []);
}

function saveIdeaCommentsLocal(comments: IdeaComment[]): void {
  saveToStorage(IDEA_COMMENTS_KEY, comments);
}

function loadThreadsLocal(): ThreadItem[] {
  return loadFromStorage<ThreadItem[]>(THREADS_KEY, []);
}

function saveThreadsLocal(threads: ThreadItem[]): void {
  saveToStorage(THREADS_KEY, threads);
}

function loadThreadCommentsLocal(): ThreadComment[] {
  return loadFromStorage<ThreadComment[]>(THREAD_COMMENTS_KEY, []);
}

function saveThreadCommentsLocal(comments: ThreadComment[]): void {
  saveToStorage(THREAD_COMMENTS_KEY, comments);
}

export function loadUserProfile(): UserProfile | null {
  return loadFromStorage<UserProfile | null>(USER_KEY, null);
}

export function saveUserProfile(user: UserProfile | null): void {
  saveToStorage(USER_KEY, user);
}

export async function loadIdeas(): Promise<Idea[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('ideas')
      .select('id,user_id,user_name,pos_name,main_txt,tags,color,latitude,longitude,likes,created_at')
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data.map(mapIdeaRow);
    }
  }
  return loadIdeasLocal();
}

export async function saveIdeas(ideas: Idea[]): Promise<void> {
  if (!isSupabaseEnabled) {
    saveIdeasLocal(ideas);
    return;
  }
  saveIdeasLocal(ideas);
}

export async function getIdeaById(id: string): Promise<Idea | undefined> {
  if (supabase) {
    const { data, error } = await supabase
      .from('ideas')
      .select('id,user_id,user_name,pos_name,main_txt,tags,color,latitude,longitude,likes,created_at')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) {
      return mapIdeaRow(data);
    }
  }
  return loadIdeasLocal().find((idea) => idea.id === id);
}

export async function addIdea(payload: {
  userId: string;
  userName: string;
  posName: string;
  mainTxt: string;
  tags: string[];
  color: string;
  latitude: number;
  longitude: number;
}): Promise<Idea> {
  const idea: Idea = {
    id: createId('idea'),
    userId: payload.userId,
    userName: payload.userName,
    posName: payload.posName,
    mainTxt: payload.mainTxt,
    tags: payload.tags,
    color: payload.color,
    latitude: payload.latitude,
    longitude: payload.longitude,
    likes: 0,
    createdAt: new Date().toISOString(),
  };
  if (supabase) {
    const { error } = await supabase.from('ideas').insert({
      id: idea.id,
      user_id: idea.userId,
      user_name: idea.userName,
      pos_name: idea.posName,
      main_txt: idea.mainTxt,
      tags: idea.tags,
      color: idea.color,
      latitude: idea.latitude,
      longitude: idea.longitude,
      likes: idea.likes,
      created_at: idea.createdAt,
    });
    if (!error) {
      // notify listeners
      storeEventTarget.dispatchEvent(new Event('ideasUpdated'));
      return idea;
    }
    console.error('Supabase insert ideas failed:', error);
  }
  const ideas = loadIdeasLocal();
  ideas.unshift(idea);
  saveIdeasLocal(ideas);
  storeEventTarget.dispatchEvent(new Event('ideasUpdated'));
  return idea;
}

export async function updateIdea(id: string, payload: {
  posName: string;
  mainTxt: string;
  tags: string[];
  color?: string;
}): Promise<Idea | undefined> {
  if (supabase) {
    const updatePayload: any = {
      pos_name: payload.posName,
      main_txt: payload.mainTxt,
      tags: payload.tags,
    };
    if (payload.color) {
      updatePayload.color = payload.color;
    }
    const { data, error } = await supabase
      .from('ideas')
      .update(updatePayload)
      .eq('id', id)
      .select('id,user_id,user_name,pos_name,main_txt,tags,color,latitude,longitude,likes,created_at')
      .maybeSingle();
    if (!error && data) {
      storeEventTarget.dispatchEvent(new Event('ideasUpdated'));
      return mapIdeaRow(data);
    }
  }

  const ideas = loadIdeasLocal().map((idea) =>
    idea.id === id
      ? { ...idea, posName: payload.posName, mainTxt: payload.mainTxt, tags: payload.tags, color: payload.color ?? idea.color }
      : idea,
  );
  saveIdeasLocal(ideas);
  storeEventTarget.dispatchEvent(new Event('ideasUpdated'));
  return ideas.find((idea) => idea.id === id);
}

export async function deleteIdea(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('ideas').delete().eq('id', id);
    if (!error) {
      storeEventTarget.dispatchEvent(new Event('ideasUpdated'));
      return;
    }
    console.error('Supabase delete ideas failed:', error);
  }

  const ideas = loadIdeasLocal().filter((idea) => idea.id !== id);
  saveIdeasLocal(ideas);
  storeEventTarget.dispatchEvent(new Event('ideasUpdated'));
}



export async function likeIdea(id: string): Promise<void> {
  if (supabase) {
    const existing = await getIdeaById(id);
    if (existing) {
      const { error } = await supabase
        .from('ideas')
        .update({ likes: existing.likes + 1 })
        .eq('id', id);
      if (!error) {
        return;
      }
    }
  }
  const ideas = loadIdeasLocal().map((idea) =>
    idea.id === id ? { ...idea, likes: idea.likes + 1 } : idea,
  );
  saveIdeasLocal(ideas);
}

export async function loadIdeaComments(): Promise<IdeaComment[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('idea_comments')
      .select('id,idea_id,user_id,user_name,com_txt,created_at')
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data.map(mapIdeaCommentRow);
    }
  }
  return loadIdeaCommentsLocal();
}

export async function getIdeaComments(ideaId: string): Promise<IdeaComment[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('idea_comments')
      .select('id,idea_id,user_id,user_name,com_txt,created_at')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data.map(mapIdeaCommentRow);
    }
  }
  return loadIdeaCommentsLocal().filter((comment) => comment.ideaId === ideaId);
}

export async function addIdeaComment(payload: {
  ideaId: string;
  userId: string;
  userName: string;
  comTxt: string;
}): Promise<IdeaComment> {
  const comment: IdeaComment = {
    id: createId('comment'),
    ideaId: payload.ideaId,
    userId: payload.userId,
    userName: payload.userName,
    comTxt: payload.comTxt,
    createdAt: new Date().toISOString(),
  };
  if (supabase) {
    const { error } = await supabase.from('idea_comments').insert({
      id: comment.id,
      idea_id: comment.ideaId,
      user_id: comment.userId,
      user_name: comment.userName,
      com_txt: comment.comTxt,
      created_at: comment.createdAt,
    });
    if (!error) {
      storeEventTarget.dispatchEvent(new Event('ideaCommentsUpdated'));
      return comment;
    }
    console.error('Supabase insert idea_comments failed:', error);
  }
  const comments = loadIdeaCommentsLocal();
  comments.unshift(comment);
  saveIdeaCommentsLocal(comments);
  storeEventTarget.dispatchEvent(new Event('ideaCommentsUpdated'));
  return comment;
}

export async function deleteIdeaComment(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('idea_comments').delete().eq('id', id);
    if (!error) {
      storeEventTarget.dispatchEvent(new Event('ideaCommentsUpdated'));
      return;
    }
    throw new Error('Supabase delete idea_comments failed: ' + (error?.message ?? 'unknown error'));
  }

  const comments = loadIdeaCommentsLocal().filter((comment) => comment.id !== id);
  saveIdeaCommentsLocal(comments);
  storeEventTarget.dispatchEvent(new Event('ideaCommentsUpdated'));
}

export async function loadThreads(): Promise<ThreadItem[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('threads')
      .select('id,user_id,user_name,title,created_at')
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data.map(mapThreadRow);
    }
  }
  return loadThreadsLocal();
}

export async function getThreadById(id: string): Promise<ThreadItem | undefined> {
  if (supabase) {
    const { data, error } = await supabase
      .from('threads')
      .select('id,user_id,user_name,title,created_at')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) {
      return mapThreadRow(data);
    }
  }
  return loadThreadsLocal().find((thread) => thread.id === id);
}

export async function addThread(payload: {
  userId: string;
  userName: string;
  title: string;
}): Promise<ThreadItem> {
  const thread: ThreadItem = {
    id: createId('thread'),
    userId: payload.userId,
    userName: payload.userName,
    title: payload.title,
    createdAt: new Date().toISOString(),
  };
  if (supabase) {
    const { error } = await supabase.from('threads').insert({
      id: thread.id,
      user_id: thread.userId,
      user_name: thread.userName,
      title: thread.title,
      created_at: thread.createdAt,
    });
    if (!error) {
      storeEventTarget.dispatchEvent(new Event('threadsUpdated'));
      return thread;
    }
    console.error('Supabase insert threads failed:', error);
  }
  const threads = loadThreadsLocal();
  threads.unshift(thread);
  saveThreadsLocal(threads);
  storeEventTarget.dispatchEvent(new Event('threadsUpdated'));
  return thread;
}

export async function updateThread(id: string, payload: { title: string }): Promise<ThreadItem | undefined> {
  if (supabase) {
    const { data, error } = await supabase
      .from('threads')
      .update({ title: payload.title })
      .eq('id', id)
      .select('id,user_id,user_name,title,created_at')
      .maybeSingle();
    if (!error && data) {
      return mapThreadRow(data);
    }
  }

  const threads = loadThreadsLocal().map((thread) =>
    thread.id === id ? { ...thread, title: payload.title } : thread,
  );
  saveThreadsLocal(threads);
  return threads.find((thread) => thread.id === id);
}

export async function deleteThread(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('threads').delete().eq('id', id);
    if (!error) {
      storeEventTarget.dispatchEvent(new Event('threadsUpdated'));
      return;
    }
    throw new Error('Supabase delete threads failed: ' + (error?.message ?? 'unknown error'));
  }

  const threads = loadThreadsLocal().filter((thread) => thread.id !== id);
  saveThreadsLocal(threads);
  storeEventTarget.dispatchEvent(new Event('threadsUpdated'));
}

export async function loadThreadComments(): Promise<ThreadComment[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('thread_comments')
      .select('id,thread_id,user_id,user_name,com_txt,likes,created_at')
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data.map(mapThreadCommentRow);
    }
  }
  return loadThreadCommentsLocal();
}

export async function getThreadComments(threadId: string): Promise<ThreadComment[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('thread_comments')
      .select('id,thread_id,user_id,user_name,com_txt,likes,created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data.map(mapThreadCommentRow);
    }
  }
  return loadThreadCommentsLocal().filter((comment) => comment.threadId === threadId);
}

export async function addThreadComment(payload: {
  threadId: string;
  userId: string;
  userName: string;
  comTxt: string;
}): Promise<ThreadComment> {
  const comment: ThreadComment = {
    id: createId('thread-comment'),
    threadId: payload.threadId,
    userId: payload.userId,
    userName: payload.userName,
    comTxt: payload.comTxt,
    likes: 0,
    createdAt: new Date().toISOString(),
  };
  if (supabase) {
    const { error } = await supabase.from('thread_comments').insert({
      id: comment.id,
      thread_id: comment.threadId,
      user_id: comment.userId,
      user_name: comment.userName,
      com_txt: comment.comTxt,
      likes: comment.likes,
      created_at: comment.createdAt,
    });
    if (!error) {
      storeEventTarget.dispatchEvent(new Event('threadCommentsUpdated'));
      return comment;
    }
    console.error('Supabase insert thread_comments failed:', error);
  }
  const comments = loadThreadCommentsLocal();
  comments.unshift(comment);
  saveThreadCommentsLocal(comments);
  storeEventTarget.dispatchEvent(new Event('threadCommentsUpdated'));
  return comment;
}

export async function deleteThreadComment(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('thread_comments').delete().eq('id', id);
    if (!error) {
      storeEventTarget.dispatchEvent(new Event('threadCommentsUpdated'));
      return;
    }
    throw new Error('Supabase delete thread_comments failed: ' + (error?.message ?? 'unknown error'));
  }

  const comments = loadThreadCommentsLocal().filter((comment) => comment.id !== id);
  saveThreadCommentsLocal(comments);
  storeEventTarget.dispatchEvent(new Event('threadCommentsUpdated'));
}

export async function likeThreadComment(commentId: string): Promise<void> {
  if (supabase) {
    const existing = loadThreadCommentsLocal().find((comment) => comment.id === commentId);
    if (existing) {
      const { error } = await supabase
        .from('thread_comments')
        .update({ likes: existing.likes + 1 })
        .eq('id', commentId);
      if (!error) {
        storeEventTarget.dispatchEvent(new Event('threadCommentsUpdated'));
        return;
      }
    }
  }
  const comments = loadThreadCommentsLocal().map((comment) =>
    comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment,
  );
  saveThreadCommentsLocal(comments);
  storeEventTarget.dispatchEvent(new Event('threadCommentsUpdated'));
}

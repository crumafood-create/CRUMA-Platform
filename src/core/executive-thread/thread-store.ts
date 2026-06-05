import { ThreadItem, ThreadStatus } from './types';

const threadStore: ThreadItem[] = [];

export function addThreadItem(item: ThreadItem) {
  threadStore.unshift(item);
}

export function getThreadItems() {
  return threadStore;
}

export function updateThreadStatus(
  id: string,
  status: ThreadStatus,
) {
  const item = threadStore.find((x) => x.id === id);

  if (!item) return;

  item.status = status;
  item.updatedAt = new Date().toISOString();
}

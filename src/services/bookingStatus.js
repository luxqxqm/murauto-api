// Which statuses a booking can move to; done and canceled are final
export const STATUS_TRANSITIONS = {
  new: ['confirmed', 'canceled'],
  confirmed: ['done', 'canceled'],
  done: [],
  canceled: [],
};

export const canChangeStatus = (from, to) =>
  STATUS_TRANSITIONS[from]?.includes(to) ?? false;

export enum RequestStatus {
  CREATED = 'CREATED',
  VISIBLE_TO_TRAVELERS = 'VISIBLE_TO_TRAVELERS',
  ACCEPTED = 'ACCEPTED',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum RequestTransition {
  // From CREATED
  CREATED_TO_VISIBLE = 'CREATED_TO_VISIBLE',
  CREATED_TO_CANCELLED = 'CREATED_TO_CANCELLED',
  
  // From VISIBLE_TO_TRAVELERS
  VISIBLE_TO_ACCEPTED = 'VISIBLE_TO_ACCEPTED',
  VISIBLE_TO_CANCELLED = 'VISIBLE_TO_CANCELLED',
  VISIBLE_TO_EXPIRED = 'VISIBLE_TO_EXPIRED',
  
  // From ACCEPTED
  ACCEPTED_TO_AWAITING_PAYMENT = 'ACCEPTED_TO_AWAITING_PAYMENT',
  ACCEPTED_TO_CANCELLED = 'ACCEPTED_TO_CANCELLED',
  
  // From AWAITING_PAYMENT
  AWAITING_PAYMENT_TO_IN_PROGRESS = 'AWAITING_PAYMENT_TO_IN_PROGRESS',
  AWAITING_PAYMENT_TO_CANCELLED = 'AWAITING_PAYMENT_TO_CANCELLED',
  
  // From IN_PROGRESS
  IN_PROGRESS_TO_DELIVERED = 'IN_PROGRESS_TO_DELIVERED',
  IN_PROGRESS_TO_CANCELLED = 'IN_PROGRESS_TO_CANCELLED',
  
  // Terminal states (no outgoing transitions)
  // DELIVERED, CANCELLED, EXPIRED
}

export const VALID_TRANSITIONS: Record<RequestStatus, RequestTransition[]> = {
  [RequestStatus.CREATED]: [
    RequestTransition.CREATED_TO_VISIBLE,
    RequestTransition.CREATED_TO_CANCELLED,
  ],
  [RequestStatus.VISIBLE_TO_TRAVELERS]: [
    RequestTransition.VISIBLE_TO_ACCEPTED,
    RequestTransition.VISIBLE_TO_CANCELLED,
    RequestTransition.VISIBLE_TO_EXPIRED,
  ],
  [RequestStatus.ACCEPTED]: [
    RequestTransition.ACCEPTED_TO_AWAITING_PAYMENT,
    RequestTransition.ACCEPTED_TO_CANCELLED,
  ],
  [RequestStatus.AWAITING_PAYMENT]: [
    RequestTransition.AWAITING_PAYMENT_TO_IN_PROGRESS,
    RequestTransition.AWAITING_PAYMENT_TO_CANCELLED,
  ],
  [RequestStatus.IN_PROGRESS]: [
    RequestTransition.IN_PROGRESS_TO_DELIVERED,
    RequestTransition.IN_PROGRESS_TO_CANCELLED,
  ],
  [RequestStatus.DELIVERED]: [], // Terminal state
  [RequestStatus.CANCELLED]: [], // Terminal state
  [RequestStatus.EXPIRED]: [], // Terminal state
};

export const TERMINAL_STATES = [
  RequestStatus.DELIVERED,
  RequestStatus.CANCELLED,
  RequestStatus.EXPIRED,
];

export function isValidTransition(
  from: RequestStatus,
  to: RequestStatus
): boolean {
  const validTransitions = VALID_TRANSITIONS[from];
  return validTransitions.includes(getTransitionType(from, to));
}

export function getTransitionType(
  from: RequestStatus,
  to: RequestStatus
): RequestTransition {
  const transitionMap: Record<string, RequestTransition> = {
    [`${RequestStatus.CREATED}_${RequestStatus.VISIBLE_TO_TRAVELERS}`]: RequestTransition.CREATED_TO_VISIBLE,
    [`${RequestStatus.CREATED}_${RequestStatus.CANCELLED}`]: RequestTransition.CREATED_TO_CANCELLED,
    [`${RequestStatus.VISIBLE_TO_TRAVELERS}_${RequestStatus.ACCEPTED}`]: RequestTransition.VISIBLE_TO_ACCEPTED,
    [`${RequestStatus.VISIBLE_TO_TRAVELERS}_${RequestStatus.CANCELLED}`]: RequestTransition.VISIBLE_TO_CANCELLED,
    [`${RequestStatus.VISIBLE_TO_TRAVELERS}_${RequestStatus.EXPIRED}`]: RequestTransition.VISIBLE_TO_EXPIRED,
    [`${RequestStatus.ACCEPTED}_${RequestStatus.AWAITING_PAYMENT}`]: RequestTransition.ACCEPTED_TO_AWAITING_PAYMENT,
    [`${RequestStatus.ACCEPTED}_${RequestStatus.CANCELLED}`]: RequestTransition.ACCEPTED_TO_CANCELLED,
    [`${RequestStatus.AWAITING_PAYMENT}_${RequestStatus.IN_PROGRESS}`]: RequestTransition.AWAITING_PAYMENT_TO_IN_PROGRESS,
    [`${RequestStatus.AWAITING_PAYMENT}_${RequestStatus.CANCELLED}`]: RequestTransition.AWAITING_PAYMENT_TO_CANCELLED,
    [`${RequestStatus.IN_PROGRESS}_${RequestStatus.DELIVERED}`]: RequestTransition.IN_PROGRESS_TO_DELIVERED,
    [`${RequestStatus.IN_PROGRESS}_${RequestStatus.CANCELLED}`]: RequestTransition.IN_PROGRESS_TO_CANCELLED,
  };
  
  const key = `${from}_${to}`;
  return transitionMap[key];
}

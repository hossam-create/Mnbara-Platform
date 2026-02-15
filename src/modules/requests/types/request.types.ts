// request.types.ts

// Defining request states
export enum RequestState {
    Idle = 'idle',
    Loading = 'loading',
    Success = 'success',
    Error = 'error',
}

// Defining request entities
export interface RequestEntity {
    id: string;
    state: RequestState;
    data?: any;
    error?: string;
}
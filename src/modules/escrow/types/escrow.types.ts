export enum EscrowState {
    Created = 'created',
    Funded = 'funded',
    Executed = 'executed',
    Canceled = 'canceled'
}

export interface EscrowEntity {
    id: string;
    amount: number;
    state: EscrowState;
    createdAt: Date;
    updatedAt: Date;
}
export enum Frequency {
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY'
}

export interface ScheduledTransfer {
    id?: number;
    amount: number;
    startDate: string;
    endDate: string;
    frequency: Frequency;
    description: string;
    active: boolean;
    sourceAccountId: number;
    targetAccountNumber: string;
}

export interface ScheduledTransferRequest {
    amount: number;
    startDate: string;
    endDate: string;
    frequency: Frequency;
    description: string;
    sourceAccountId: number;
    targetAccountNumber: string;
}

export interface ScheduledTransferUpdateRequest {
    amount: number;
    startDate: string;
    endDate: string;
    frequency: Frequency;
    description: string;
    active: boolean;
    targetAccountNumber?: string;
} 
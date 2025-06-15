export interface LoanSimulationRequest {
  amount: number;
  termInMonths: number;
  interestRate: number;
}

export interface Installment {
  month: number;
  principal: number;
  interest: number;
  total: number;
}

export interface LoanSimulationResponse {
  monthlyPayment: number;
  totalPayment: number;
  schedule: Installment[];
}

export interface LoanApplicationRequest {
  amount: number;
  termInMonths: number;
  interestRate: number;
  accountId: number;
}

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface LoanApplicationResponse {
  id: number;
  amount: number;
  termInMonths: number;
  interestRate: number;
  status: LoanStatus;
  accountId: number;
} 
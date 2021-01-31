export interface History {
    id:number,
    userId:number,
    transaction: 'S' | 'R',
    amount: number
}
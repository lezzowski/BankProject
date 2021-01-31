import {Account} from './Account'
import {History} from './History'

export class Bank {
    constructor(public bankId:number, public bankName:string,public commission:number = 1, public bankBudget:number,  public bankClients:Account[] = [], public transactionList:History[] = []){}
}
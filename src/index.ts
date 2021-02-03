import express, {Request, Response} from 'express'
const app = express()
import {Bank} from './Bank'
import {Account} from './Account'
import bodyparser from 'body-parser'
import glob from 'glob'
import fs from 'fs'

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

let banksList: Bank[]
let path:string

glob('./src/*.json', (_,file) =>{
    path = file[0]
    let raw = fs.readFileSync(path)
    banksList = JSON.parse(raw.toString())
})

let write = ():void =>{
    let data = JSON.stringify(banksList, null, 2)
    fs.writeFileSync(path, data)
}

let saveTransaction = (senderBank:Bank,receiverBank:Bank,senderInfo:Account,receiverInfo:Account,moneySent:number):void =>{
    senderBank.transactionList.push({id: senderBank.transactionList.length, userId: senderInfo.id, transaction: "S", amount: moneySent})
    receiverBank.transactionList.push({id: receiverBank.transactionList.length, userId: receiverInfo.id, transaction: "R", amount: moneySent})

}

let updateBalance = (senderInfo:Account, receiverInfo:Account, senderBank:Bank, receiverBank:Bank, moneySent:number):void => {
    if (senderBank.bankId === receiverBank.bankId) {
        senderInfo.balance -= Number(moneySent)
        receiverInfo.balance += Number(moneySent)
    }else{
        senderInfo.balance -= Number(moneySent) + senderBank.commission
        receiverInfo.balance += Number(moneySent)
        senderBank.bankBudget += senderBank.commission
    }
}

let showBanks = (_:Request,res:Response) => {

    let banks = banksList.map(({bankId,bankName,commission}) => {
        return {
            bankId,
            bankName,
            commission
        }
    })

    if(banks){
        res.status(200).json(banks)
    }else res.status(404).json({message: "Banks not found!"})
}

let showBanksById = ({params: {id}}:Request,res:Response) => {
    if (Number(id) < 0 || Number(id) > banksList.length) res.status(400).json({ message: "Error, bank not found" })

    let single = banksList.map(({bankId,bankName,commission}) => {
        return {
            bankId,
            bankName,
            commission
        }
    })

    if(single){
        let inside = single.find(({bankId}) => bankId === Number(id))
        res.status(200).json(inside)

    }else res.status(404).json({message: "Bank not found!"})

        
}

let registerUser = ({params: {bankId}, body: {id, name, surname, balance}}:Request, res:Response) => {
    const bank = banksList.find(item => item.bankId === Number(bankId))
    if(bank){
        bank.bankClients.push(new Account(Number(bankId), id, name, surname, balance))
        write()
        res.status(201).json({message:"User created!"})
    }else{
        res.status(400).json({message:"Bank not found"})
    }
}

let showUsersOfBank = ({params: {id}}:Request, res:Response) => {
    let bank = banksList.find(({bankId}) => bankId === Number(id))
    let list = bank?.bankClients.map(({id,name,surname}) => { return {
        id,
        name,
        surname
    }})

    if(list) res.status(200).json(list)
    else res.status(404).json({message: `Bank${id} not found!`})
}

let showUserHistory = ({params: {id, user}}:Request, res:Response) => {
    let bank = banksList.find(({bankId}) => bankId === Number(id))

    if(bank){
        let userTransaction = bank.transactionList.filter(({userId}) => userId === Number(user))
        if(userTransaction) res.status(200).json(userTransaction)
        else res.status(400).json({message: "There are no transactions to show!"})

    }else res.status(400).json({message: "Bank not found!"})

}

let sendMoney = ({body: {senderBankId, senderId, receiverBankId, receiverId, moneySent}}:Request, res:Response) => {
    let senderBank = banksList.find(({bankId}) => bankId === Number(senderBankId))
    let receiverBank = banksList.find(({bankId}) => bankId === Number(receiverBankId))

    if(senderBank && receiverBank){
        let senderInfo = senderBank.bankClients.find(({id}) => id === Number(senderId))
        let receiverInfo = receiverBank.bankClients.find(({id}) => id === Number(receiverId))
        
        if((senderInfo && receiverInfo)){
            if((senderInfo.balance >= Number(moneySent) + senderBank.commission)){
                updateBalance(senderInfo,receiverInfo, senderBank, receiverBank,moneySent)
                saveTransaction(senderBank,receiverBank,senderInfo,receiverInfo,moneySent)
                write()

                res.status(200).json({
                    message: `Money transferred! Amount: €${moneySent} Money transferred!`,
                    commission: `€${senderBank.commission}`})
            }else res.status(400).json({message: "Not enough money!"})
        }else res.status(400).json({message:"User not found!"})
    }else res.status(400).json({message:"Bank not found!"})
}

app.get('/banks', showBanks)
app.get('/banks/:id', showBanksById) 
app.get('/banks/:id/users', showUsersOfBank)
app.get('/banks/:id/users/:user',showUserHistory)
app.post('/banks/:bankId', registerUser)
app.put('/banks/send', sendMoney)

const port = 5003
app.listen(port, () => console.log('Server is running'))
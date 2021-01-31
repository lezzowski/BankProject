import express, {Request, Response, NextFunction} from 'express'
const app = express()
import {Bank} from './Bank'
import {Account} from './Account'
import bodyparser from 'body-parser'
import glob from 'glob'
import fs from 'fs'



app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

let banksList: Bank[]
let path:any 

glob('./src/*.json', (_,file) =>{
    path = file[0]
    let raw = fs.readFileSync(path)
    let banks = JSON.parse(raw.toString())
    banksList = banks.map((value:any) => value)
})

var write = ():void =>{
    let data = JSON.stringify(banksList, null, 2)
    fs.writeFileSync(path, data)
}

var saveTransaction = (senderBank:Bank,receiverBank:Bank,senderInfo:Account,receiverInfo:Account,moneySent:number):void =>{
    senderBank.transactionList.push({id: senderBank.transactionList.length, userId: senderInfo.id, transaction: "S", amount: moneySent})
    receiverBank.transactionList.push({id: receiverBank.transactionList.length, userId: receiverInfo.id, transaction: "R", amount: moneySent})

}

var showBanks = (_:any,res:Response) => {

    var banks = banksList.map(({bankId,bankName,commission}) => {
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

var showBanksById = ({params: {id}}:Request,res:Response) => {
    if (Number(id) < 0 || Number(id) > banksList.length) {
        return res.status(400).json({ message: "Error, bank not found" })
    }

    var single = banksList.map(({bankId,bankName,commission}) => {
        return {
            bankId,
            bankName,
            commission
        }
    })

    if(single){
        var inside = single.find(({bankId}) => bankId === Number(id))
        res.status(200).json(inside)

    }else res.status(404).json({message: "Bank not found!"})

        
}

var registerUser = ({params: {bankId}, body: {id, name, surname, balance}}:Request, res:Response) => {
    if(banksList.find(item => item.bankId === Number(bankId))){
        banksList.find(item => item.bankId === Number(bankId))?.bankClients.push(new Account(Number(bankId), id, name, surname, balance))
        write()
        res.status(201).json({message:"User created!"})
    }else{
        res.status(400).json({message:"Bank not found"})
    }
}

var showUsersOfBank = ({params: {id}}:Request, res:Response) => {
    var bank = banksList.find(({bankId}) => bankId === Number(id))
    var list = bank?.bankClients.map(({id,name,surname}) => { return {
        id,
        name,
        surname
    }})

    if(list) res.status(200).json(list)
    else res.status(404).json({message: `Bank${id} not found!`})
}

var userHistory = ({params: {id, user}}:Request, res:Response) => {
    var bank = banksList.find(({bankId}) => bankId === Number(id))

    if(bank){
        var userTransaction = bank.transactionList.filter(({userId}) => userId === Number(user))
        if(userTransaction){
            res.status(200).json(userTransaction)
        }else res.status(400).json({message: "No transaction showable!"})

    }else res.status(400).json({message: "Bank not found!"})

}


var sendMoney = ({body: {senderBankId, senderId, receiverBankId, receiverId, moneySent}}:Request, res:Response) => {
    var senderBank = banksList.find(({bankId}) => bankId === Number(senderBankId))
    var receiverBank = banksList.find(({bankId}) => bankId === Number(receiverBankId))

    if(senderBank && receiverBank){
        var senderInfo = senderBank.bankClients.find(({id}) => id === Number(senderId))
        var receiverInfo = receiverBank.bankClients.find(({id}) => id === Number(receiverId))
        
        const sameBank = senderBank.bankId === receiverBank.bankId
        
        if((senderInfo && receiverInfo)){
            if(sameBank){
                if((senderInfo.balance >= Number(moneySent))){

                    senderInfo.balance -= Number(moneySent)
                    receiverInfo.balance += Number(moneySent)
                    
                    saveTransaction(senderBank,receiverBank,senderInfo,receiverInfo,moneySent)
                    write()

                    res.status(200).json({message: `Money transfered! Amount:${moneySent} Money transfered!`})

                }else res.status(400).json({message: "Not enough money!"})

            }else{
                if((senderInfo.balance >= (Number(moneySent) + senderBank.commission))){

                    senderInfo.balance -= Number(moneySent) + senderBank.commission
                    receiverInfo.balance += Number(moneySent)
                    senderBank.bankBudget += senderBank.commission

                    saveTransaction(senderBank,receiverBank,senderInfo,receiverInfo,moneySent)
                    write()

                    res.status(200).json({message: `Money transfered! Amount:${moneySent}+${senderBank.commission} commission`})

                }else res.status(400).json({message: "Not enough money!"})
            } 
            
        }else res.status(400).json({message:"User not found!"})
        
    }else res.status(400).json({message:"Bank not found!"})
}

app.get('/banks', showBanks)
app.get('/banks/:id', showBanksById)
app.get('/banks/:id/users', showUsersOfBank)
app.get('/banks/:id/users/:user',userHistory)
app.post('/banks/:bankId', registerUser)
app.put('/banks/send', sendMoney)

const port = 5003
app.listen(port, () => console.log('Server is running'))
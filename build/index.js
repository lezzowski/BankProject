"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var app = express_1.default();
var Account_1 = require("./Account");
var body_parser_1 = __importDefault(require("body-parser"));
var glob_1 = __importDefault(require("glob"));
var fs_1 = __importDefault(require("fs"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
var banksList;
var path;
glob_1.default('./src/*.json', function (_, file) {
    path = file[0];
    var raw = fs_1.default.readFileSync(path);
    var banks = JSON.parse(raw.toString());
    banksList = banks.map(function (value) { return value; });
});
var write = function () {
    var data = JSON.stringify(banksList, null, 2);
    fs_1.default.writeFileSync(path, data);
};
var showBanks = function (_, res) {
    res.status(200).json(banksList);
};
var showBanksById = function (_a, res) {
    var bankId = _a.params.bankId;
    if (Number(bankId) < 0 || Number(bankId) > banksList.length) {
        return res.status(400).json({ message: "Error, bank not found" });
    }
    var bank = banksList.find(function (list) { return list.bankId == Number(bankId); });
    res.status(200).json(bank);
};
var registerUser = function (_a, res) {
    var _b;
    var bankId = _a.params.bankId, _c = _a.body, id = _c.id, name = _c.name, surname = _c.surname, balance = _c.balance;
    if (banksList.find(function (item) { return item.bankId === Number(bankId); })) {
        (_b = banksList.find(function (item) { return item.bankId === Number(bankId); })) === null || _b === void 0 ? void 0 : _b.bankClients.push(new Account_1.Account(Number(bankId), id, name, surname, balance));
        write();
        res.status(201).json({ message: "User created!" });
    }
    else {
        res.status(400).json({ message: "Bank not found" });
    }
};
var showUsersOfBank = function (_a, res) {
    var id = _a.params.id;
    var users = banksList.find(function (_a) {
        var bankId = _a.bankId;
        return bankId = Number(id);
    });
    if (users)
        res.status(200).json(users.bankClients);
    else
        res.status(404).json({ message: "Bank" + id + " not found!" });
};
var userByIdBankId = function (_a, res) {
    var _b = _a.params, id = _b.id, userId = _b.userId;
    var bank = banksList.find(function (_a) {
        var bankId = _a.bankId;
        return bankId = Number(id);
    });
    console.log(bank);
};
var sendMoney = function (_a, res) {
    var _b = _a.body, senderBankId = _b.senderBankId, senderId = _b.senderId, receiverBankId = _b.receiverBankId, receiverId = _b.receiverId, moneySent = _b.moneySent;
    var senderBank = banksList.find(function (item) { return item.bankId === Number(senderBankId); });
    var receiverBank = banksList.find(function (item) { return item.bankId === Number(receiverBankId); });
    if (senderBank && receiverBank) {
        var senderInfo = senderBank.bankClients.find(function (item) { return item.id === Number(senderId); });
        var receiverInfo = receiverBank.bankClients.find(function (item) { return item.id === Number(receiverId); });
        var sameBank = senderBank.bankId === receiverBank.bankId;
        if (sameBank) {
            if ((senderInfo && receiverInfo)) {
                if ((senderInfo.balance >= Number(moneySent))) {
                    senderInfo.balance -= Number(moneySent);
                    receiverInfo.balance += Number(moneySent);
                    senderBank.transactionList.push({ id: senderBank.transactionList.length, userId: senderInfo.id, transaction: "S", amount: moneySent });
                    receiverBank.transactionList.push({ id: receiverBank.transactionList.length, userId: receiverInfo.id, transaction: "R", amount: moneySent });
                    write();
                    res.status(200).json({ message: "Money transfered! Amount:" + moneySent + " Money transfered!" });
                }
                else
                    res.status(400).json({ message: "Not enough money!" });
            }
            else
                res.status(400).json({ message: "User not found!" });
        }
        else {
            if ((senderInfo && receiverInfo)) {
                if ((senderInfo.balance >= (Number(moneySent) + senderBank.commission))) {
                    senderInfo.balance -= Number(moneySent) + senderBank.commission;
                    receiverInfo.balance += Number(moneySent);
                    senderBank.bankBudget += senderBank.commission;
                    senderBank.transactionList.push({ id: senderBank.transactionList.length, userId: senderInfo.id, transaction: "S", amount: moneySent });
                    receiverBank.transactionList.push({ id: receiverBank.transactionList.length, userId: receiverInfo.id, transaction: "R", amount: moneySent });
                    write();
                    res.status(200).json({ message: "Money transfered! Amount:" + moneySent + "+" + senderBank.commission + " commission" });
                }
                else
                    res.status(400).json({ message: "Not enough money!" });
            }
            else
                res.status(400).json({ message: "User not found!" });
        }
    }
    else
        res.status(400).json({ message: "Bank not found!" });
};
app.get('/:id', userByIdBankId);
app.get('/banks', showBanks);
app.get('/banks/:bankId', showBanksById);
app.get('/banks/:id/users', showUsersOfBank);
app.post('/banks/:bankId', registerUser);
app.put('/banks/send', sendMoney);
var port = 5003;
app.listen(port, function () { return console.log('Server is running'); });

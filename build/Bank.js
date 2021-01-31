"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bank = void 0;
var Bank = /** @class */ (function () {
    function Bank(bankId, bankName, commission, bankBudget, bankClients, transactionList) {
        if (commission === void 0) { commission = 1; }
        if (bankClients === void 0) { bankClients = []; }
        if (transactionList === void 0) { transactionList = []; }
        this.bankId = bankId;
        this.bankName = bankName;
        this.commission = commission;
        this.bankBudget = bankBudget;
        this.bankClients = bankClients;
        this.transactionList = transactionList;
    }
    return Bank;
}());
exports.Bank = Bank;

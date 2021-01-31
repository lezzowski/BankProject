"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
var Account = /** @class */ (function () {
    function Account(bankId, id, name, surname, balance) {
        if (balance === void 0) { balance = 0; }
        this.bankId = bankId;
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.balance = balance;
    }
    return Account;
}());
exports.Account = Account;

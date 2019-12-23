import { LightningElement, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import Id from '@salesforce/user/Id';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import NAME_FIELD from '@salesforce/schema/User.Name';
import STATUS_FIELD from '@salesforce/schema/Goal__c.Status__c';
import GOAL_OBJECT from '@salesforce/schema/Goal__c';

export default class YearlyReview extends LightningElement {
    @track username;
    @track userId;
    @track getPicklistValues;
    @track allGoals = [];
    @track allAccomplishments = [];

    @wire(getRecord, {
        recordId: Id,
        fields: [NAME_FIELD]
    }) wireUser({err, data}) {
        if (err) {
            console.error(err);
        } else if (data) {
            this.username = data.fields.Name.value;
            this.userId = Id;
        }
    }

    @wire(getObjectInfo, { objectApiName: GOAL_OBJECT })
    objectInfo;

    @wire(getPicklistValues, {
        recordTypeId: '$objectInfo.data.defaultRecordTypeId',
        fieldApiName: STATUS_FIELD
    })statusValues({err, data}) {
        if (data) {
            this.getPicklistValues = data.values;
        }
    }

    get userName() {
        if (this.username) {
            return 'Yearly Review for ' + this.username;
        } else {
            return 'Yearly Review for ---'
        }
    }
}

console.log('what is status field? ', STATUS_FIELD);
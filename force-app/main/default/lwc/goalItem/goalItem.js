import { LightningElement, api, track } from 'lwc';
import { goalObj, handleToastEvent, successMessages } from 'c/yearlyReviewModule';
import { createRecord } from 'lightning/uiRecordApi';
import { updateRecord } from 'lightning/uiRecordApi';
import GOAL_OBJECT from '@salesforce/schema/Goal__c';
import GOAL_FIELD from '@salesforce/schema/Goal__c.Goal__c';
import STATUS_FIELD from '@salesforce/schema/Goal__c.Status__c';
import CONVERTED_FIELD from '@salesforce/schema/Goal__c.Converted__c';
import SUBMITTED_FIELD from '@salesforce/schema/Goal__c.Submitted__c';
import GOAL_ID_FIELD from '@salesforce/schema/Goal__c.Id';

export default class GoalItem extends LightningElement {
    @api status;
    @api goal;
    @api index;
    @api submitted;
    @api accomplished;
    @api salesforceid;
    @api incomingstatus;
    @api incominggoalvalue;
    @track statusValue;
    @track goalValue;
    @track isAccomplished;

    connectedCallback() {
        console.log('what is goal? ', this.goal);
        this.statusValue = this.incomingstatus;
        this.goalValue = this.incominggoalvalue;
    }

    removeGoal(event) {
        let currIndex = event.target.dataset.index;
        event.preventDefault();

        // Creates the event with the contact ID data.
        const selectedEvent = new CustomEvent('remove', { detail: {index: currIndex, removal: true, accomplished: false, goal: this.goal}});

        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }

    async addGoal(event) {
        this.goal.converted = true;
        event.preventDefault();
        let goalValue = this.template.querySelector("lightning-input").value;
        let statusValue = this.statusValue;
        
        if (goalValue && statusValue) {
            if (this.salesforceid) {
                // do update stuff
                this.updateGoal(goalValue, statusValue, this.salesforceid, false);
            } else {
                let goalFunction = new goalObj(this.index, this.index, null, null, goalValue, statusValue, true, false, false, null);
                let goalObject = Object.create(goalFunction);

                let resultId = await this.createGoal(goalObject.status, goalObject.goal, goalObject.submitted);
                if (resultId) {
                    goalObject.salesforceId = resultId;
                    this.salesforceid = resultId;
                    // Creates the event with the contact ID data.
                    const selectedEvent = new CustomEvent('selected', { detail: goalObject });
                    // Dispatches the event.to update goals
                    this.dispatchEvent(selectedEvent);
    
                    this.dispatchEvent(handleToastEvent('Goal Added!', successMessages(), 'success', 'pester'));
    
                    this.accomplished = true;
                }
            }
        } else {
            this.dispatchEvent(handleToastEvent('Oops! Add some detail first!',
                                                'Be sure to add a goal and a status before you submit!',
                                                'error',
                                                'pester'));
        }
    }

    async createGoal(status, goalText, submitted) {
        const fields = {};
        fields[GOAL_FIELD.fieldApiName] = goalText;
        fields[STATUS_FIELD.fieldApiName] = status;
        fields[SUBMITTED_FIELD.fieldApiName] = submitted;

        let goalPromise = new Promise((resolve, reject) => {
            const recordInput = { apiName: GOAL_OBJECT.objectApiName, fields};
            createRecord(recordInput).then(goal => {
                if (goal) {
                    resolve(goal.id)
                } else {
                    reject(console.error('this is an error'));
                }
            }).catch(error => {
                this.dispatchEvent(
                    handleToastEvent('Oops! Add some detail first!',
                                                error.body.message,
                                                'error',
                                                'pester'));
            })
        });

        let result = await goalPromise;
        if (result) {
            return result;
        } else {
            return null;
        }
    }

    updateGoal(goalValue, status, salesforceid, converted) {
        const fields = {};
        fields[GOAL_ID_FIELD.fieldApiName] = salesforceid;
        fields[GOAL_FIELD.fieldApiName] = goalValue;
        fields[STATUS_FIELD.fieldApiName] = status;
        fields[CONVERTED_FIELD.fieldApiName] = converted;
        const recordInput = { fields };
        updateRecord(recordInput).then(() => {
            this.dispatchEvent(handleToastEvent('Goal Updated!',
                                                'Awesome! Your goal has been updated! Thanks for staying on top of it!',
                                                'success',
                                                'pester'));
        });
    }

    handleStatusChange(event) {
        let fieldName = event.target.name;
        if( fieldName === 'status' ){
            this.statusValue = event.target.value;
        }
    }

    handleAccomplished(event) {

        if (this.goal.converted === false) {
            this.dispatchEvent(handleToastEvent('Please submit first!',
                                                'Please submit your goal before moving it to accomplished!',
                                                'error',
                                                'pester'));
            event.target.checked = false;
        } else {
            this.updateGoal(this.goalValue, this.statusValue, this.salesforceid, true);

            let currIndex = event.target.dataset.index;
            event.preventDefault();

            // Creates the event with the contact ID data.
            const selectedEvent = new CustomEvent('remove', { detail: {index: currIndex, removal: false, converted: true, goal: this.goal}});

            // Dispatches the event.
            this.dispatchEvent(selectedEvent);
        }
    }
}
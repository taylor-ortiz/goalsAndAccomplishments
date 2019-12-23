import { LightningElement, api, track } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { updateRecord } from 'lightning/uiRecordApi';
import ACCOMPLISH_OBJECT from '@salesforce/schema/Accomplishment__c';
import ACCOMPLISH_TEXT_FIELD from '@salesforce/schema/Accomplishment__c.Accomplishment__c';
import GOAL_ACCOMPLISHED_FIELD from '@salesforce/schema/Accomplishment__c.Goal_Accomplished__c';
import ACCOMPLISHMENT_ID_FIELD from '@salesforce/schema/Accomplishment__c.Id';
import { handleToastEvent } from 'c/yearlyReviewModule';

export default class AccomplishmentItem extends LightningElement {
    @api incomingaccomplishment;
    @api incomingaccomplishmentstatus;
    @api accompsalesforceid;
    @api index;
    @track accomplishmentValue;
    @track accomplishmentStatus;
    async connectedCallback() {
        this.accomplishmentValue = this.incomingaccomplishment;
        this.accomplishmentStatus = this.incomingaccomplishmentstatus;
        console.log('what is sf id? ', this.accompsalesforceid);
        if (!this.accompsalesforceid) {
            let accomplishmentId = await this.createGoal(this.accomplishmentValue, true);
            console.log('what is the accomplishment id? ', accomplishmentId);
            if (accomplishmentId) {
                this.accompsalesforceid = accomplishmentId;
            }
        }
    }

    async createGoal(accomplishText, accomplished) {
        const fields = {};
        fields[ACCOMPLISH_TEXT_FIELD.fieldApiName] = accomplishText;
        fields[GOAL_ACCOMPLISHED_FIELD.fieldApiName] = accomplished;

        let goalPromise = new Promise((resolve, reject) => {
            const recordInput = { apiName: ACCOMPLISH_OBJECT.objectApiName, fields};
            createRecord(recordInput).then(accomplishment => {
                if (accomplishment) {
                    console.log('what is the value of goal? ', accomplishment);
                    this.dispatchEvent(
                        handleToastEvent('Congratulations on your Accomplishment!',
                                                    'Awesome job and way to accomplish your goals!!',
                                                    'success',
                                                    'pester'));
                    resolve(accomplishment.id)
                } else {
                    reject(console.error('this is an error'));
                }
            }).catch(error => {
                this.dispatchEvent(
                    handleToastEvent('Oops! Hang tight! Your accomplishment wasnt created.',
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

    handleMoveBackToGoal(event) {
        let currIndex = event.target.dataset.index;
            event.preventDefault();

            // Creates the event with the contact ID data.
            const selectedEvent = new CustomEvent('revert', { detail: {index: currIndex, reverted: true}});

            // Dispatches the event.
            this.dispatchEvent(selectedEvent);
    }
}
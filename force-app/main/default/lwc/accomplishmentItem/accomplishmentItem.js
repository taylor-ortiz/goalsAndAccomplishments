import { LightningElement, api, track } from 'lwc';
import { createRecord, updateRecord } from 'lightning/uiRecordApi';
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
    @api accomplishment;
    @track accomplishmentValue;
    @track accomplishmentStatus;
    async connectedCallback() {
        this.accomplishmentValue = this.incomingaccomplishment;
        this.accomplishmentStatus = this.incomingaccomplishmentstatus;
        if (this.accomplishment.accomplishmentSFId === null) {
            let accomplishmentId = await this.createGoal(this.accomplishmentValue, true);
            if (accomplishmentId) {
                this.accomplishment.accomplishmentSFId = accomplishmentId;
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

        //this.accomplishment.converted = false;

        // Creates the event with the contact ID data.
        const selectedEvent = new CustomEvent('revert', { detail: {index: currIndex, reverted: true, accomplishment: this.accomplishment}});

        // Dispatches the event.
        this.dispatchEvent(selectedEvent);

        this.updateAccomplishment(this.accomplishment.accomplishmentSFId, false);
    }

    updateAccomplishment(Id, accomplished) {
        const fields = {};
        fields[ACCOMPLISHMENT_ID_FIELD.fieldApiName] = Id;
        fields[GOAL_ACCOMPLISHED_FIELD.fieldApiName] = accomplished;
        const recordInput = { fields };
        updateRecord(recordInput);
    }
}
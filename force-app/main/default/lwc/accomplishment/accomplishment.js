import { LightningElement, api, track } from 'lwc';
import { configureCustomMessage, register, goalObj, fire } from 'c/yearlyReviewModule';
import getAccomplishments from '@salesforce/apex/yearlyReview.getAccomplishments';

export default class Accomplishment extends LightningElement {

    @api userName;
    @api userid;
    @track accomplishments = [];
    @track data; 
    eventFiredCallback;
    initialized;

    eventFired(event){
        event.detail.accomplishIndex = this.accomplishments.length;
        this.accomplishments.push(event.detail);
    }
    connectedCallback(){

        getAccomplishments({userId: this.userid}).then(data => {
            if (data) {
                this.accomplishments = data.map( (accomplish, index) => {
                    let goalFunction = new goalObj(index, null, index, null, accomplish.Accomplishment__c, 'Completed', true, false, accomplish.Goal_Accomplished__c, accomplish.Id);
                    return Object.create(goalFunction);
                })
            }
        }).catch(err => console.log(err));

        this.data='callback' ; 
        this.eventFiredCallback = this.eventFired.bind(this); 
        this.register();
    }
    @api
    register(){
        this.data+=' - register' ;
        register('accomplish', this.eventFiredCallback ); 
    }

    get customMessage() {
        if (this.userName) {
            return configureCustomMessage(this.userName, true);
        } else {
            return null;
        }
    }

    get accomplishmentSize() {
        if (this.accomplishments.length === 0) {
            return true;
        } else {
            return false;
        }
    }

    handleRevert(event) {
        if (this.accomplishments[event.detail.index] !== 'undefined') {
            fire('revert', {detail: event.detail.accomplishment});
            this.removeIndexFromArray(event.detail.index);
        }
    }

    removeIndexFromArray(row) {
        this.accomplishments.splice(row, 1);

        // happens regardless of removal or accomplishment 
        this.accomplishments.forEach(this.resetIndexAndIdAfterRemoval);
    }

    resetIndexAndIdAfterRemoval(item, index, arr) {
        arr[index].goalIndex = index;
    }
}
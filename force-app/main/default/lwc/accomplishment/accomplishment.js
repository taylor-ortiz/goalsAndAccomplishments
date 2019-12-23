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
        console.log("this is actually happening");
        event.detail.accomplishIndex = this.accomplishments.length;
        console.log("what is event detail? ", event.detail);
        this.accomplishments.push(event.detail);
        
        console.log("what are accomplishments? ", this.accomplishments[0].salesforceId);
    }
    connectedCallback(){

        getAccomplishments({userId: this.userid}).then(data => {
            console.log('this is the accomp data? ', data);
            if (data) {
                this.accomplishments = data.map( (accomplish, index) => {
                    let goalFunction = new goalObj(index, null, index, null, accomplish.Accomplishment__c, 'Completed', true, false, accomplish.Goal_Accomplished__c, accomplish.Id);
                    return Object.create(goalFunction);
                })
            }
            console.log('this is accomplishments??? ', this.accomplishments);
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
        console.log('what is event detail? ', event.detail.index);

        if (this.accomplishments[event.detail.index] !== 'undefined') {
            fire('revert', {detail: this.accomplishments[event.detail.index]});
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
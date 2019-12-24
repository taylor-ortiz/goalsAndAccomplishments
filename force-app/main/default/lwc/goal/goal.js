import { LightningElement, api, track } from 'lwc';
import { deleteRecord, updateRecord } from 'lightning/uiRecordApi';
import { configureCustomMessage, goalObj, handleToastEvent, fire, register } from 'c/yearlyReviewModule';
import getGoals from '@salesforce/apex/yearlyReview.getGoals';
import CONVERTED_FIELD from '@salesforce/schema/Goal__c.Converted__c';
import GOAL_ID_FIELD from '@salesforce/schema/Goal__c.Id';

export default class Goal extends LightningElement {
    @api goalStatus;
    @api userName
    @api userid;
    @track goals = [];
    @track initialized;
    @track itemSubmitted;
    @track data; 
    eventFiredCallback;

    connectedCallback() {
        getGoals({userId: this.userid}).then(data => {
            if (data) {
                this.initialized = true;
                this.itemSubmitted = true;
                this.goals = data.map( (goal, index) => {
                    let goalFunction = new goalObj(index, index, null, goal.Id, goal.Goal__c, goal.Status__c, goal.Submitted__c, false, goal.Converted__c, null);
                    return Object.create(goalFunction);
                })
            }
        }).catch(err => console.log(err));

        this.data='callback' ; 
        this.eventFiredCallback = this.eventFired.bind(this); 
        this.register();
    }

    eventFired(event){
        this.goals.push(event.detail);
        this.updateGoal(event.detail.salesforceId, false);
    }

    @api
    register(){
        this.data+=' - register' ;
        register('revert', this.eventFiredCallback ); 
    }

    get customMessage() {
        if (this.userName) {
            return configureCustomMessage(this.userName, false);
        } else {
            return null;
        }
    }

    handleInitAddRow() {
        if (!this.itemSubmitted && this.goals.length !== 0) {
            this.dispatchEvent(handleToastEvent(`You're so ambitious!`,
                                                'Please submit or remove your last goal before you add more goals.', 
                                                'error',
                                                'pester'));
        } else {
            this.initialized = true;
            let index = this.goals.length === 0 ? 0 : this.goals.length;
            let goalFunction = new goalObj(index, index, null, null, null, null, false, false, false, null);
            let goalObject = Object.create(goalFunction);
            this.goals.push(goalObject);
            this.itemSubmitted = goalObject.submitted;
        }
    }

    get goalsSize() {
        if (this.goals.length > 0) {
            return true
        }
        return false;
    }

    get initGoalSize() {
        if (this.goals.length === 0 && this.initialized === true) {
            return true;
        } else {
            return false;
        }
    }

    rowSelected(event) {
        const newGoalObject = event.detail;
        if (newGoalObject) {
            if (this.goals[newGoalObject.id] !== 'undefined') {
                this.goals[newGoalObject.goalIndex].goalIndex = newGoalObject.goalIndex;
                this.goals[newGoalObject.goalIndex].accomplishIndex = null;
                this.goals[newGoalObject.goalIndex].salesforceId = newGoalObject.salesforceId
                this.goals[newGoalObject.goalIndex].goal = newGoalObject.goal;
                this.goals[newGoalObject.goalIndex].status = newGoalObject.status;
                this.goals[newGoalObject.goalIndex].submitted = newGoalObject.submitted;
                this.goals[newGoalObject.goalIndex].removal = false;
                this.goals[newGoalObject.goalIndex].accomplished = false;
                this.itemSubmitted = newGoalObject.submitted;
            }
        }
    }

    removeRow(event) {
        let isRemoval = event.detail.removal;
        let isConverted = event.detail.converted;
        if (isRemoval) {
            if (event.detail.goal.salesforceId) {
                // function that serves as data base removal if an id is present
                deleteRecord(event.detail.goal.salesforceId).then(() => {
                    this.dispatchEvent(handleToastEvent('Goal Removed!',
                                                        'Your goal has successfully been removed!',
                                                        'success',
                                                        'pester'));
                })
            }
            this.removeIndexFromArray(event.detail.index);
        } else if (isConverted) {
            event.preventDefault();          
            fire('accomplish', {detail: event.detail.goal});
            this.updateGoal(event.detail.goal.salesforceId, true);
            this.removeIndexFromArray(event.detail.index);
        }
    }

    removeIndexFromArray(row) {
        this.goals.splice(row, 1);

        // happens regardless of removal or accomplishment 
        this.goals.forEach(this.resetIndexAndIdAfterRemoval);

        // happens regardless of removal or accomplishment
        if (this.goals[this.goals.length - 1]) {
            this.itemSubmitted = this.goals[this.goals.length - 1].submitted
        }
    }

    resetIndexAndIdAfterRemoval(item, index, arr) {
        arr[index].goalIndex = index;
    }

    updateGoal(Id, converted) {
        const fields = {};
        fields[GOAL_ID_FIELD.fieldApiName] = Id;
        fields[CONVERTED_FIELD.fieldApiName] = converted;
        const recordInput = { fields };
        updateRecord(recordInput);
    }
}
import { LightningElement, api, track } from 'lwc';
import { deleteRecord } from 'lightning/uiRecordApi';
import { configureCustomMessage, goalObj, handleToastEvent, fire, register } from 'c/yearlyReviewModule';
import getGoals from '@salesforce/apex/yearlyReview.getGoals';

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
            console.log('this is the data? ', data);
            if (data) {
                this.initialized = true;
                this.itemSubmitted = true;
                this.goals = data.map( (goal, index) => {
                    let goalFunction = new goalObj(index, index, null, goal.Id, goal.Goal__c, goal.Status__c, true, false, goal.Converted__c, null);
                    return Object.create(goalFunction);
                })
            }
            console.log('this is goals??? ', this.goals);
        }).catch(err => console.log(err));

        this.data='callback' ; 
        this.eventFiredCallback = this.eventFired.bind(this); 
        this.register();
    }

    eventFired(event){
        console.log("this is actually happening for accomplishments");
        console.log('what is the event? ', event.detail);
        this.goals.push(event.detail);
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
            console.log('this should be getting into here');
            let index = this.goals.length === 0 ? 0 : this.goals.length;
            let goalFunction = new goalObj(index, index, null, null, null, null, null, false, false, null);
            let goalObject = Object.create(goalFunction);
            console.log('what is the goal object on add? ', goalObject);
            this.goals.push(goalObject);
            this.itemSubmitted = goalObject.submitted;
        }
    }

    get goalsSize() {
        console.log('what is the size of the goals? ', this.goals.length);
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
        console.log('what  is the new goal object? ', this.goals[newGoalObject.id]);
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
        console.log('what are the goals? ', this.goals.forEach(goal => {console.log(goal.id)}));
    }

    removeRow(event) {
        let isRemoval = event.detail.removal;
        console.log('is removal? ', isRemoval);
        let isAccomplished = event.detail.accomplished;
        console.log('is accomplished? ', isAccomplished);
        if (isRemoval) {
            if (this.goals[event.detail.index].salesforceId) {
                // function that serves as data base removal if an id is present
                deleteRecord(this.goals[event.detail.index].salesforceId).then(() => {
                    this.dispatchEvent(handleToastEvent('Goal Removed!',
                                                        'Your goal has successfully been removed!',
                                                        'success',
                                                        'pester'));
                })
            }
            this.removeIndexFromArray(event.detail.index);
        } else if (isAccomplished) {
            event.preventDefault();
            console.log("getting in here for accomplished");
            console.log("what are the goals before the event? ", this.goals[event.detail.index]);
            fire('accomplish', {detail: this.goals[event.detail.index]});

            this.removeIndexFromArray(event.detail.index);
        }
    }

    removeIndexFromArray(row) {
        this.goals.splice(row, 1);
        console.log('what are the goals after removal? ', this.goals);

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
}
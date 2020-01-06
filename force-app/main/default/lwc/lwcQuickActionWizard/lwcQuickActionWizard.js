import { LightningElement, api, track, wire } from 'lwc';
import { getRecord, getFieldValue, createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import ID from '@salesforce/schema/Opportunity.Id';
import ACCOUNT_ID from '@salesforce/schema/Opportunity.AccountId';
import DONATION_GOAL from '@salesforce/schema/Opportunity.Donation_Goal__c';
import DONATION_COORDINATOR from '@salesforce/schema/Opportunity.Donation_Coordinator__c';
import CONTACT_OBJECT from '@salesforce/schema/Contact';
import CONTACT_FIRST_NAME from '@salesforce/schema/Contact.FirstName';
import CONTACT_LAST_NAME from '@salesforce/schema/Contact.LastName';
import CONTACT_ACCOUNT_ID from '@salesforce/schema/Contact.AccountId';
import CONTACT_CITY from '@salesforce/schema/Contact.MailingCity';
import CONTACT_STATE from '@salesforce/schema/Contact.MailingState';
import USER_NAME from '@salesforce/schema/User.Name';
import findContacts from '@salesforce/apex/DonorSearch.findContacts';
import generateDonations from '@salesforce/apex/DonorSearch.generateDonations';

/** The delay used when debouncing event handlers before invoking Apex. */
const DELAY = 300;

export default class LwcQuickActionWizard extends LightningElement {

    @api recordid; // record Id received from Lightning Component

    @track renderSearch = false; // boolean to determine which view state to render on view index #1
    @track opp; // All values related to the opportunity we need in the application
    @track items = []; // All lightning pill items that will be stored from the search
    @track donors = null; // All donors that are queried for on application load
    @track firstName = ''; // First name of new donor
    @track lastName = ''; // Last name of new donor
    @track location = ''; // Location of new donor
    @track viewIndex; // View index of the view state
    @track first = false; // View state 1
    @track second = false; // View state 2
    @track third = false; // View state 3
    @track fourth = false; // View state 4
    @track searchKey = ''; // Dynamic search key for donors search
    @track donationTotal = 0; // donation total for all donors

    radioValue = 'false'; // Default radio value for view index 1
    accountId; // Account Id from Opportunity used to associate to donor creation
    sectorValue; // Sector radio button value
    marketingValue; // Marketing radio button value
    donationCoordinator; // Donation

    // wired method to dynamically retrieve all searchable donors
    @wire(findContacts, { searchKey: '$searchKey' })
    contacts({err, data}) {
        if (data) {
            this.donors = data;
        } else if (err) {
            console.log(err);
        }
    }

    connectedCallback() {
        this.viewIndex = 0;
        this.updateWizardState(true, false, false, false);
    }

    renderSearchBlock(event) {
        let val = (event.detail.value === 'true');
        this.renderSearch = val;
    }

    handleMarketingAndSector(event) {
        const name = event.detail.name;
        console.log('what is the name? ', name);
    }

    @wire(getRecord, { recordId: '$recordid', fields: [ID, ACCOUNT_ID, DONATION_GOAL, DONATION_COORDINATOR] })
    wiredRecord({ error, data }) {
        if (error) {
            console.error('what is error? ', error);
        } else if (data) {
            this.opp = data;
            this.accountId = getFieldValue(this.opp, ACCOUNT_ID);
        }
    }

    @wire(getRecord, { recordId: DONATION_COORDINATOR, fields: [USER_NAME] })
    userWire({ error, data}) {
        if (error) {
            console.error('what is error? ', error);
        } else if (data) {
            this.donationCoordinator = data;
            console.log(JSON.stringify(this.donationCoordinator));
        }
    }

    handleNewRecordInput(event) {
        if (event.target.dataset.name ===  'first') {
            this.firstName = event.target.value
        } else if (event.target.dataset.name === 'last') {
            this.lastName = event.target.value;
        } else {
            this.location = event.target.value;
        }
    }

    handleRadioQuestionInput(event) {
        if (event.target.name === 'sectorGroup') {
            this.sectorValue = event.target.value;
        } else {
            this.marketingValue = event.target.value;
        }
    }

    createDonor() {
        let [city, state] = this.parseLocationInput(this.location);
        const fields = {};
        fields[CONTACT_FIRST_NAME.fieldApiName] = this.firstName;
        fields[CONTACT_LAST_NAME.fieldApiName] = this.lastName;
        fields[CONTACT_ACCOUNT_ID.fieldApiName] = this.accountId;
        fields[CONTACT_CITY.fieldApiName] = city;
        fields[CONTACT_STATE.fieldApiName] = state;

        const recordInput = { apiName: CONTACT_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then( (result) => {
                let elements = this.template.querySelectorAll("lightning-input")
                elements.forEach( (el) => {
                    el.value = '';
                })

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Donor created!',
                        variant: 'success',
                    }),
                );

                let tempArr = [...this.items];
                tempArr.push({
                    label: fields.FirstName + ' ' + fields.LastName,
                    name: fields.FirstName + ' ' + fields.LastName,
                    donorId: result.Id,
                    donationAmount: 0
                });
                this.items = tempArr;
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error',
                    }),
                );
            });
    }

    creationDonations() {
        const donations = JSON.stringify(this.items);
        generateDonations({donations: donations, oppId: getFieldValue(this.opp, ID)})
        .then(result => {
            if (result) {
                this.dispatchEvent(new CustomEvent('closeaction'));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Assessment Completed!',
                        message: 'Thanks for completing the assessment! Your donations have been generated',
                        variant: 'success',
                    }),
                );
            }
        });
    }

    handleInput(event) {
        if (this.delayTimeout) {
            window.clearTimeout(this.delayTimeout);
        }
        const searchKey = event.target.value;
        this.delayTimeout = setTimeout(() => {
            this.searchKey = searchKey;
        }, DELAY);
    }

    handleSelection(event) {
        this.searchKey = '';
        let name = event.detail.FirstName + ' ' + event.detail.LastName;
        const found = this.items.some(item => item.label === name);
        if (!found) {
            this.items = [...this.items, {label: name, 
                name: name, donorId: event.detail.Id, donationAmount: 0}];
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Already added!',
                    message: 'You have already added that donor!',
                    variant: 'error',
                }),
            );
        }
    }

    handleItemRemove(event) {
        // with itemremove, you automatically get the item (name) and the index that is removed from items
        const index = event.detail.index;
        // Generate a copy of the items array using the spead operator
        let tempArr = [...this.items];
        // Splice the necessary index given to you by the event
        tempArr.splice(index, 1);
        // Recreate the items array
        this.items = tempArr;
    }

    parseLocationInput(location) {
        let locArr;
        if (location.indexOf(',') > -1) {
            locArr = location.split(',');
        } else if (location.indexOf(' ') > -1) {
            locArr = location.split(' ');
        }
        return [locArr[0].replace(/\s/g, ''), locArr[1].replace(/\s/g, '')];
    }

    handleNext() {
        this.viewIndex = this.viewIndex + 1;
        this.parseIndex(this.viewIndex);
        return null;
    }

    parseIndex(viewIndex) {
        switch(true){
            case viewIndex === 0:
                this.updateWizardState(true, false, false, false);
                break;
            case viewIndex === 1:
                this.updateWizardState(false, true, false, false);
                break;
            case viewIndex === 2:
                this.updateWizardState(false, false, true, false);
                this.donationTotal = this.calculateTotal();
                break;
            case viewIndex === 3:
                this.updateWizardState(false, false, false, true);

                break;
            default:
                return null;
        }
    }

    handlePrevious() {
        this.viewIndex = this.viewIndex - 1;
        this.parseIndex(this.viewIndex);
    }

    updateWizardState(first, second, third, fourth) {
        this.first = first;
        this.second = second;
        this.third = third;
        this.fourth = fourth;
    }

    handleItemDonationAmount(event) {
        this.updateItems(event.detail.index, event.detail.newVal);
    }

    updateItems(index, val) {
        if (this.items[index]) {
            this.items = this.items.map( (item, ind) => {
                if (ind === index) {
                    item.donationAmount = val;
                }
                return item;
            })
        }
    }

    qualifyItemDonations() {
        return this.items.some(item => item.donationAmount === 0);
    }

    calculateTotal() {
        if (!this.qualifyItemDonations()) {
            return this.items.reduce( ( sum , cur ) =>  sum + cur.donationAmount , 0);
        }
        return null;
    }

    get qualifyDonorCreation() {
        return this.firstName !== '' && this.lastName !== '' && this.location !== '' ? false : true;
    }

    get options() {
        return [
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' },
        ];
    }

    get marketingOptions() {
        return [
            { label: 'Friend', value: 'Friend' },
            { label: 'Social Media', value: 'Social Media' },
            { label: 'Volunteer Match', value: 'Volunteer Match' },
            { label: 'Denver Gives Network', value: 'Denver Gives Network' },
            { label: 'Other', value: 'Other' },
        ];
    }

    get sectorOptions() {
        return [
            { label: 'Big Brother/Sister Program', value: 'Big Brother/Sister Program' },
            { label: 'Families In Need', value: 'Families In Need' },
            { label: 'Imagination Limitless', value: 'Imagination Limitless' },
            { label: 'Kids in Technology', value: 'Kids in Technology' },
        ];
    }

    get itemSize() {
        if (this.items.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    get enableNext() {
        // conditional indexing
        if (this.viewIndex === 0) {
            return this.items.length > 0 ? false : true;
        } else if (this.viewIndex === 1) {
            return this.qualifyItemDonations();
        }
        return false;
    }

    get enabledCompleteAssessment() {
        return this.viewIndex > 2 ? true : false;
    }

    get enablePrevious() {
        return this.viewIndex > 0 ? false : true;
    }

    get donorsSize() {
        if (this.donors.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    get progress() {
        return this.viewIndex.toString();
    }

    get donationProgress() {
        if (this.opp.fields.Donation_Goal__c.value && !this.qualifyItemDonations()) {
            let amount = this.calculateTotal();
            return ((100 * amount) / this.opp.fields.Donation_Goal__c.value).toString();
        }
        return "0";
    }
}
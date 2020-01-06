import { LightningElement, api } from 'lwc';

export default class SearchResult extends LightningElement {
    @api donor;

    get location() {
        if (this.donor.MailingAddress.city && this.donor.MailingAddress.state) {
            return this.donor.MailingAddress.city + ', ' + this.donor.MailingAddress.state;
        } else {
            return '----'
        }
    }

    get name() {
        if (this.donor.FirstName && this.donor.LastName) {
            return this.donor.FirstName + ' ' + this.donor.LastName;
        } else {
            return '----'
        }
    }

    handleDonorSelection(event) {
        // Prevents the anchor element from navigating to a URL.
        event.preventDefault();

        // Creates the event with the contact ID data.
        const selectedEvent = new CustomEvent('selected', { detail: this.donor});

        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }
}
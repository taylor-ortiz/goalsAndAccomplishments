public class DonorSearch {

    public static final Id recordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByName().get('Donor').getRecordTypeId();

    @AuraEnabled(Cacheable=true)
    public static List<Contact> findContacts(String searchKey) {
        if (String.isBlank(searchKey)) {
            return new List<Contact>();
        } else {
            String enhancedTerm = '%' + searchKey + '%';
            List<Contact> contacts =  [SELECT Id, FirstName, LastName, MailingAddress FROM Contact WHERE (FirstName LIKE :enhancedTerm OR LastName LIKE :enhancedTerm) AND RecordTypeId = :recordTypeId];
            return contacts;
        }
    }

    @AuraEnabled
    public static Boolean generateDonations(String donations, String oppId){

        List<Donation> records = (List<Donation>) System.JSON.deserialize(donations, List<Donation>.class);
        System.debug('what are donations? ' + records);
        List<Donation__c> donationRecords = new List<Donation__c>();
        for (Donation theDonation : records) {
            Donation__c donation = new Donation__c();
            donation.Donation_Amount__c = theDonation.donationAmount;
            donation.Donor__c = theDonation.donorId;
            donation.Opportunity__c = oppId;
            donationRecords.add(donation);
        }

        try {
            insert donationRecords;
            return true;
        } catch(exception ex) {
            System.debug('There has been an issue with inserting records. Please review the message: ' + ex.getMessage());
            return false;
        }
    }

    public class Donation {

        public String label;
        public String name;
        public String donorId;
        public Integer donationAmount;

    }
}

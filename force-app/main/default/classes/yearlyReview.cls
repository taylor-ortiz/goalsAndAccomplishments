public class yearlyReview {
    @AuraEnabled(cacheable=true)
    public static List<Goal__c> getGoals(Id userId) {
        return [SELECT Goal__c, Status__c, Converted__c, Submitted__c FROM Goal__c WHERE OwnerId =: userId AND Converted__c = false];
    }
    @AuraEnabled(cacheable=true)
    public static List<Accomplishment__c> getAccomplishments(Id userId) {
        return [SELECT Id, Accomplishment__c, Goal_Accomplished__c FROM Accomplishment__c WHERE OwnerId = :userId AND Goal_Accomplished__c = true];
    }
}

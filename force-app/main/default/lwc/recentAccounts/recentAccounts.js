import { LightningElement} from 'lwc';
import cloud from '@salesforce/resourceUrl/wordCloud';
import { NavigationMixin } from 'lightning/navigation';
import { loadScript } from 'lightning/platformResourceLoader';
import getAccounts from '@salesforce/apex/ctrlGetAccounts.getAccounts';
export default class RecentAccounts extends NavigationMixin(LightningElement) {

    jsInitialized = false;
    
    navigate(Id) {
        console.log('what is id? ', Id);
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: Id,
                objectApiName: 'Account',
                actionName: 'view',
            },
        });
    }

    renderedCallback() {
        if (this.jsInitialized) {
            return;
        }
        this.jsInitialized = true;

        loadScript(this, cloud)
            .then(() => {
                var self = this;
                getAccounts()
                    .then(result => {
                        var List = new Array();

                        for (let i = 0; i < result.length; i++) {
                            List[i] = new Array ( result[i].Name, i, result[i].Id );
                        }

                        let options = {
                            'list' : List,
                            'fontFamily' : 'Arial',
                            'fontWeight' : 'normal',
                            'click' : function(item, dimension, event){
                                let Id = item[2];
                                self.navigate(Id);
                            }
                        }
                        window.WordCloud(this.template.querySelector('canvas.my_canvas'), options);
                    })
            })
            .catch(error => {
                this.error = error;
            });
    }
}
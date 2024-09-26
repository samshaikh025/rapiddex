import { openDB } from "idb";
import { BehaviorSubject } from "rxjs";

export class SharedService {

    // Hold a reference to the single created instance
    // of the Singleton, initially set to null.
    public static instance: SharedService | null = null;

    // Make the constructor private to block instantiation
    // outside of the class.
    public constructor() {
        // initialization code
    }

    // Provide a static method that allows access
    // to the single instance.
    public static getSharedServiceInstance(): SharedService {
        // Check if an instance already exists.
        // If not, create one.
        if (this.instance === null) {
            this.instance = new SharedService();
        }
        // Return the instance.
        return this.instance;
    }

    public abc = 0;
    public walletAddress$ = new BehaviorSubject('');
    public walletAddress = this.walletAddress$.asObservable();

    public openWalletModal$ = new BehaviorSubject(null);
    public openWalletModal = this.openWalletModal$.asObservable();

    DB_NAME = 'IndexDB';
    STORE_NAME = 'Store';
    DB_VERSION = 1;

    SharedService()
    {

    }
    setData(key:string,data: any)
    {
        localStorage.setItem(key, JSON.stringify(data));
    }

    getData(key:string)
    {
        let data = localStorage.getItem(key)
        if(data)
        {
            return JSON.parse(data);      
        }else{
            return null;
        }
    }

    removeData(key:string)
    {
      localStorage.removeItem(key)
    }

    async setIndexDbItem(key: string, value: any) {
        const db = await this.getDB();
        return db.put(this.STORE_NAME, value, key);
      }
      
    async getIndexDbItem(key: string) {
        const db = await this.getDB();
        return db.get(this.STORE_NAME, key);
    }

    async removeIndexDbItem(key) {
      const db = await this.getDB();
      return db.delete(this.STORE_NAME, key);
    }

    async getDB() {
      return openDB(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('Store')) {
            db.createObjectStore('Store');
          }
        }
      });
    }
    
    setTheme(mode: string) {
      const root = document.documentElement;
      if(mode == 'DARK') {
        // dark Theme
        root.style.setProperty('--body-bg', 'radial-gradient(123.22% 129.67% at 100.89% -5.6%, #05040B 0%, #060316 100%');
        root.style.setProperty('--primary-color', '#fff');
        root.style.setProperty('--primary-color-8', '#322C4B');
        root.style.setProperty('--primary-icon-color', '#BC9FED');
        root.style.setProperty('--white-color', '#ffffff');
        root.style.setProperty('--black-color', '#ffffff');
        root.style.setProperty('--border-color', '#d5d5ee');
        root.style.setProperty('--border-color-40', '#BC9FED');
        root.style.setProperty('--outer-card-bg', 'linear-gradient(210.96deg, rgba(32, 20, 96, 0.61) 0.01%, rgba(49, 30, 95, 0.7) 42.05%, rgba(57, 33, 113, 0.1) 104.81%)');
        root.style.setProperty('--inner-card-bg', '#372A77');
        root.style.setProperty('--header-card', '#0f0d1d');
        root.style.setProperty('--box-shadow', '0px 20px 69px 0px #080711D8');
        root.style.setProperty('--inner-card-box-shadow', '50px 38px 102.37px 0px #78769424');
      } 
      else if(mode == 'LIGHT')
      {
        //light
        root.style.setProperty('--body-bg', 'radial-gradient(123.22% 129.67% at 100.89% -5.6%,#fbfbfd 0%,#f2f2ff 100%)');
        root.style.setProperty('--primary-color', '#5244d2');
        root.style.setProperty('--primary-color-8', '#5244d214');
        root.style.setProperty('--primary-icon-color', '#7851bc');
        root.style.setProperty('--white-color', '#ffffff');
        root.style.setProperty('--black-color', '#151231');
        root.style.setProperty('--border-color', '#d5d5ee');
        root.style.setProperty('--border-color-40', '#d5d5ee66');
        root.style.setProperty('--outer-card-bg', 'linear-gradient(210.96deg,rgba(245, 242, 255, 0.8) 0.01%,#f5f1ff 42.05%,rgba(247, 243, 255, 0.06) 104.81%)');
        root.style.setProperty('--inner-card-bg', 'linear-gradient(241.25deg,rgba(255, 255, 255, 0.45) 4.4%,rgba(255, 255, 255, 0.65) 61.77%,rgba(255, 255, 255, 0.54) 119.94%)');
        root.style.setProperty('--header-card', 'linear-gradient(90deg, #f3f3ff 29.59%, #f2f2ff 100%)');
        root.style.setProperty('--box-shadow', '0px 20px 69px 0px #dfdcffd8');
        root.style.setProperty('--inner-card-box-shadow', '50px 38px 102.37px 0px #78769424');
      }
    }
}
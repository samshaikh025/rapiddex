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
}
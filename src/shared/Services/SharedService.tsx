import { openDB } from "idb";

export class SharedService {

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

    async setIndexDbItem(key: string, value: any) {
        const db = await this.getDB();
        return db.put(this.STORE_NAME, value, key);
      }
      
    async getIndexDbItem(key: string) {
        const db = await this.getDB();
        return db.get(this.STORE_NAME, key);
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
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, setDoc, getDocs, query, where } from '@angular/fire/firestore';
import { Workday } from './workday.model';

@Injectable({ providedIn: 'root' })
export class WorkdayService {
  constructor(private firestore: Firestore) {}

  async getWorkdays(userId: string): Promise<Workday[]> {
    const workdaysRef = collection(this.firestore, 'workdays');
    const q = query(workdaysRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workday));
  }

  async saveWorkday(workday: Workday): Promise<void> {
    const workdaysRef = collection(this.firestore, 'workdays');
    if (workday.id) {
      const workdayDoc = doc(this.firestore, 'workdays', workday.id);
      await setDoc(workdayDoc, workday);
    } else {
      await addDoc(workdaysRef, workday);
    }
  }
}

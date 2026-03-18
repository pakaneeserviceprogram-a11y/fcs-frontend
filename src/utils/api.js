// ไฟล์ src/utils/api.js
import axios from 'axios';

// สร้าง instance ของ axios
const api = axios.create({
  // ดึงค่า URL มาจากไฟล์ .env
  baseURL: import.meta.env.VITE_API_BASE_URL,
  
  // จากโค้ดของคุณ ผมเห็นว่ามีการส่ง Header นี้ทุกครั้ง 
  // เราสามารถใส่ไว้ตรงนี้ที่เดียวได้เลยครับ หน้าอื่นจะได้ไม่ต้องพิมพ์ซ้ำ
  headers: {
    'x-tenant-id': '2',
    'Content-Type': 'application/json'
  }
});

export default api;
import React from 'react';
import MemeMakerComponent from './components/MememakerComponent'; 

function App() {
  return (
    <div className="app-container">
      {/*Đặt component MemeMakerComponent vào đây*/}
      <h1>Capacitor Meme Maker App 📸</h1>
      <MemeMakerComponent />
      {/*Thêm header, footer, hoặc router sau nếu có*/}
    </div>
  );
}

export default App;
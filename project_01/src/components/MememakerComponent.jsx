import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMemeMaker, saveMeme, shareMeme } from '../hooks/useMememaker'; 

// ----------------------------------------------------------------------
// 1. STYLES (Dùng Inline Styles cho Demo/Prototype)
// ----------------------------------------------------------------------
const styles = {
    // 1. CĂN GIỮA TOÀN BỘ CONTAINER
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Căn giữa theo chiều ngang
        padding: '20px',
        minHeight: '100vh',
        boxSizing: 'border-box',
        backgroundColor: '#f0f0f0',
    },
    // 2. KHU VỰC HIỂN THỊ CANVAS
    displayArea: {
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center',
        width: '100%',
        maxWidth: '500px', 
        marginBottom: '20px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '4px solid #fff',
    },
    // 3. KHU VỰC ĐIỀU KHIỂN
    controlsPanel: {
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    // 4. SẮP XẾP NÚT THÀNH HÀNG NGANG
    actionButtonsRow: {
        display: 'flex',
        justifyContent: 'space-between', 
        gap: '10px',
        width: '100%',
    },
    // 5. STYLES NÚT (Base)
    buttonBase: {
        padding: '12px 18px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '16px',
        fontWeight: 'bold',
        flexGrow: 1, 
        cursor: 'pointer',
        transition: 'opacity 0.2s',
    },
    // Styles cụ thể
    buttonPrimary: { backgroundColor: '#4CAF50', color: 'white' }, // Xanh lá
    buttonSecondary: { backgroundColor: '#008CBA', color: 'white' }, // Xanh dương
    buttonDanger: { backgroundColor: '#f44336', color: 'white' }, // Đỏ
    placeholder: {
        padding: '50px', 
        minHeight: '300px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        textAlign: 'center',
        color: '#666',
    }
};

// Merge Base Style vào các Style cụ thể
const primaryStyle = {...styles.buttonBase, ...styles.buttonPrimary};
const secondaryStyle = {...styles.buttonBase, ...styles.buttonSecondary};
const dangerStyle = {...styles.buttonBase, ...styles.buttonDanger};
// ----------------------------------------------------------------------


function MemeMakerComponent() {
    // --- 1. STATE VÀ HOOKS ---
    const { imageUrl, setImageUrl, takePicture } = useMemeMaker(); 
    
    const [isDrawing, setIsDrawing] = useState(false); 
    const [originalDataUrl, setOriginalDataUrl] = useState(null); // Lưu trữ ảnh gốc đã resize
    
    const canvasRef = useRef(null);
    const contextRef = useRef(null);

    // --- 2. LOGIC CANVAS: LOAD ẢNH VÀ THIẾT LẬP CONTEXT ---
    useEffect(() => {
        if (!imageUrl || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.crossOrigin = 'Anonymous'; 
        img.onload = () => {
            // Thiết lập kích thước Canvas dựa trên kích thước ảnh đã resize
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0, img.width, img.height);
            
            // LƯU TRỮ ẢNH GỐC ĐÃ LOAD XONG
            setOriginalDataUrl(imageUrl);

            // Cài đặt Context vẽ
            contextRef.current = ctx;
            contextRef.current.strokeStyle = '#22cd44ff'; // Màu vẽ mặc định: Đỏ
            contextRef.current.lineWidth = 8; 
            contextRef.current.lineCap = 'round'; 
        };
        img.src = imageUrl;
    }, [imageUrl]);

    // --- 3. LOGIC VẼ TỰ DO (Freehand Drawing) ---

    const getCoordinates = (nativeEvent) => {
        if (!canvasRef.current) return { offsetX: 0, offsetY: 0 };
        
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = nativeEvent.touches ? nativeEvent.touches[0].clientX : nativeEvent.clientX;
        const clientY = nativeEvent.touches ? nativeEvent.touches[0].clientY : nativeEvent.clientY;
        
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        
        return {
            offsetX: (clientX - rect.left) * scaleX,
            offsetY: (clientY - rect.top) * scaleY,
        };
    };

    const startDrawing = useCallback(({ nativeEvent }) => {
        if (!contextRef.current) return;
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    }, []);

    const stopDrawing = useCallback(() => {
        if (!contextRef.current) return;
        contextRef.current.closePath();
        setIsDrawing(false);
    }, []);

    const draw = useCallback(({ nativeEvent }) => {
        if (!isDrawing || !contextRef.current) return;
        
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    }, [isDrawing]);


    // --- 4. HÀM ĐIỀU KHIỂN THÊM (Xóa & Reset) ---
    
    /** Xóa toàn bộ nét vẽ và giữ lại ảnh gốc. */
    const handleClearDrawing = () => {
        if (!contextRef.current || !originalDataUrl || !canvasRef.current) return;

        // Xóa sạch canvas
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Vẽ lại ảnh gốc
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
             contextRef.current.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
        };
        img.src = originalDataUrl;
    };
    
    /** Reset Canvas, các state và gọi lại hàm chọn ảnh (Đã sửa lỗi). */
    const handleResetAndChooseNew = () => {
        // 1. Reset các State
        setImageUrl(undefined); 
        setOriginalDataUrl(null); 

        // 2. Gọi hàm Native API để mở thư viện ảnh
        takePicture(); 
    }


    // --- 5. HÀM XỬ LÝ CHÍNH (Lưu & Chia sẻ) ---
    
    const handleFinalizeAndSave = () => {
        if (!canvasRef.current) {
            alert('Chưa có nội dung để lưu!');
            return;
        }
        const finalDataUrl = canvasRef.current.toDataURL('image/png');
        saveMeme(finalDataUrl);
    };

    const handleShare = () => {
        if (!canvasRef.current) {
            alert('Chưa có nội dung để chia sẻ!');
            return;
        }
        const finalDataUrl = canvasRef.current.toDataURL('image/png');
        shareMeme(finalDataUrl); 
    };

    // --- 6. GIAO DIỆN JSX ---
    return (
        <div style={styles.container}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Doodle App (Capacitor + React)</h2>

            {/* KHU VỰC HIỂN THỊ CANVAS & THAO TÁC */}
            <div style={styles.displayArea}>
                {imageUrl ? (
                    <canvas 
                        ref={canvasRef} 
                        // Sự kiện cho Chuột
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing} 
                        onMouseMove={draw}
                        // Sự kiện cho Cảm ứng (Touch)
                        onTouchStart={startDrawing}
                        onTouchEnd={stopDrawing}
                        onTouchCancel={stopDrawing} 
                        onTouchMove={draw}
                    />
                ) : (
                    <div style={styles.placeholder}>
                        <p>Chưa có ảnh. Bấm nút "Chọn Ảnh" để bắt đầu.</p>
                    </div>
                )}
            </div>

            {/* KHU VỰC ĐIỀU KHIỂN INPUT */}
            <div style={styles.controlsPanel}>
                
                {/* HÀNG NÚT 1: CHỌN/CHỌN LẠI ẢNH VÀ XÓA NÉT VẼ */}
                <div style={styles.actionButtonsRow}>
                    <button 
                        style={styles.buttonPrimary} 
                        onClick={takePicture}
                    >
                        Chọn ảnh
                    </button>
                    <button 
                        style={dangerStyle} 
                        onClick={handleClearDrawing} 
                        disabled={!imageUrl}
                    >
                        Xóa Nét Vẽ
                    </button>
                </div>

                {/* HÀNG NÚT 2: LƯU VÀ CHIA SẺ */}
                <div style={styles.actionButtonsRow}>
                    <button 
                        style={secondaryStyle} 
                        onClick={handleFinalizeAndSave} 
                        disabled={!imageUrl}
                    >
                        Lưu Ảnh
                    </button>
                    <button 
                        style={secondaryStyle} 
                        onClick={handleShare} 
                        disabled={!imageUrl}
                    >
                        Chia Sẻ Ảnh
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MemeMakerComponent;
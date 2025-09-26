import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/** Lưu Meme vào Pictures. */
export const saveMeme = async (dataUrl) => {
    try {
        const base64Data = dataUrl.split(',')[1];
        const fileName = `meme_${new Date().getTime()}.png`;

        const result = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Pictures, 
            recursive: true,
        });

        alert(`Đã lưu ảnh nguệch ngoạc thành công: ${result.uri}`);
    } catch (e) {
        console.error('Lỗi khi lưu ảnh:', e);
        alert('Không thể lưu ảnh. Kiểm tra quyền truy cập lưu trữ.');
    }
};

/** Chia sẻ Meme. */
export const shareMeme = async (dataUrl) => {
    try {
        const base64Data = dataUrl.split(',')[1];
        const fileName = `temp_doodle_share.png`;

        const result = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache, 
        });

        await Share.share({
            title: 'Doodle App',
            text: 'Ảnh nguệch ngoạc của tôi!',
            url: result.uri, 
        });

    } catch (e) {
        console.error('Lỗi khi chia sẻ:', e);
        alert('Không thể chia sẻ ảnh.');
    }
};

export const useMemeMaker = () => {
    const [imageUrl, setImageUrl] = useState(undefined); 

    const takePicture = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.DataUrl, 
                source: CameraSource.Photos, 

                width: 500,
                height: 500,
            });

            if (image.dataUrl) {
                setImageUrl(image.dataUrl);
            }
        } catch (e) {
            console.error('Lỗi khi chọn ảnh:', e);
            alert('Không thể truy cập thư viện ảnh.');
            setImageUrl(undefined);
        }
    };

    // Hook chỉ trả về state và hàm quản lý ảnh
    return { 
        imageUrl, 
        takePicture, 
    };
};
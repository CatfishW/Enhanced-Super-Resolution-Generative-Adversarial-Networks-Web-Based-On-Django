from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer
import cv2
import time
def inferenceSR(filename,scale):
    model_8x = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=8)
    model_4x = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
    model_2x = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
    #netscale = 4
    print(scale)
    if scale == 4:
        upsampler = RealESRGANer(
                    scale=scale,
                    model_path='weights/RealESRGAN_x4plus.pth',
                    dni_weight=None,
                    model=model_4x,
                    tile=0,
                    tile_pad=10,
                    pre_pad=0,
                    half=True,
                    gpu_id=0)
    elif scale == 2:
        upsampler = RealESRGANer(
                    scale=scale,
                    model_path='weights/RealESRGAN_x2plus.pth',
                    dni_weight=None,
                    model=model_2x,
                    tile=0,
                    tile_pad=10,
                    pre_pad=0,
                    half=True,
                    gpu_id=0)
    elif scale == 8:
        upsampler = RealESRGANer(
                    scale=scale,
                    model_path='weights/RealESRGAN_x8.pth',
                    dni_weight=None,
                    model=model_8x,
                    tile=0,
                    tile_pad=10,
                    pre_pad=0,
                    half=True,
                    gpu_id=0)
    img = cv2.imread(filename, cv2.IMREAD_UNCHANGED)
    cv2.imwrite('static/result/in.png', img)
    output, _ = upsampler.enhance(img, outscale=scale)
    cv2.imwrite('static/result/out.png', output)
    time.sleep(0.5)
    
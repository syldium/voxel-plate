import { VoxelPlateRenderer } from '../VoxelPlateRenderer';

export function registerBlockTextures(plate: VoxelPlateRenderer): void {
    plate.withTexture('pointed_dripstone', (state) => {
        let filename = 'pointed_dripstone_';
        if (state.Properties?.direction === 'up') {
            filename += 'up_';
        } else {
            filename += 'down_';
        }
        filename += state.Properties?.thickness;
        return filename;
    });
}

export interface BlockState {
    Name: string;
    Properties?: BlockStateProperties;
}

interface BlockStateProperties {
    // Logs
    axis?: typeof axisProperties[number];

    // Slabs
    type?: typeof typesProperties[number];

    // Stairs, torchs, trapdoors
    facing?: typeof facingProperties[number];

    // Stairs
    half?: typeof halfProperties[number];
    shape?:
        | typeof shapeStairsProperties[number]
        | typeof shapeRailsProperties[number];

    // Redstone
    powered?: typeof boolProperties[number];

    // Furnaces
    lit?: typeof boolProperties[number];

    // Fences, glass panes
    east?: typeof boolProperties[number];
    north?: typeof boolProperties[number];
    south?: typeof boolProperties[number];
    west?: typeof boolProperties[number];

    thickness?: typeof thicknessProperties[number];
    direction?: typeof directionProperties[number];
}

export const axisProperties = ['x', 'y', 'z'] as const;
export const boolProperties = ['true', 'false'] as const;
export const directionProperties = ['up', 'down'] as const;
export const facingProperties = [
    'north',
    'south',
    'west',
    'east',
    'up',
    'down'
] as const;
export const halfProperties = ['top', 'bottom'] as const;
export const shapeStairsProperties = [
    'straight',
    'inner_left',
    'inner_right',
    'outer_left',
    'outer_right'
] as const;
export const shapeRailsProperties = [
    'north_south',
    'east_west',
    'ascending_east',
    'ascending_west',
    'ascending_north',
    'ascending_south',
    'south_east',
    'south_west',
    'north_west',
    'north_east'
] as const;
export const typesProperties = ['top', 'bottom', 'double'] as const;
export const thicknessProperties = [
    'tip_merge',
    'tip',
    'frustum',
    'middle',
    'base'
] as const;

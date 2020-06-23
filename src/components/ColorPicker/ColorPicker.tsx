import React, { useState } from 'react';
import { ChromePicker } from 'react-color';
import { Popover } from '@material-ui/core';

interface ColorPickerProps {
	defaultColor?: string;
	isOpen: boolean;
	onClose: (color: string) => void;
	anchorEl: any;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ isOpen, onClose, anchorEl, defaultColor = '#fff' }: ColorPickerProps) => {
	const [color, setColor] = useState<string>(defaultColor);

	return (
		<Popover
			open={isOpen}
			onClose={() => onClose(color!)}
			anchorOrigin={{
				vertical: 'bottom',
				horizontal: 'center',
			}}
			transformOrigin={{
				vertical: 'top',
				horizontal: 'center',
			}}
			anchorEl={anchorEl}>
			<ChromePicker color={color} onChange={(ev) => setColor(ev.hex)} />
		</Popover>
	);
};

export default ColorPicker;

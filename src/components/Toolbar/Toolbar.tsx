import { Button, IconButton, Popover, Slider, Toolbar } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { FaEraser, FaEyeDropper, FaMagic, FaTrash } from 'react-icons/fa';
import { scale } from '../../utils';
import ColorPicker from '../ColorPicker';
import './Toolbar.scss';

interface ToolbarProps {
	currentlyActive: string;
	colors: string[];
	onColorChange: (color: string) => void;
	onPopoverStateChange?: (open: boolean) => void;
	onStrokeWidthChanged: (strokeWidth: number) => void;
	initialStrokeWidth?: number;
	onDeleteAll?: () => void;
	disabled?: boolean;
}

const CustomToolbar: React.FC<ToolbarProps> = ({
	colors,
	onColorChange,
	currentlyActive,
	onPopoverStateChange,
	onStrokeWidthChanged,
	initialStrokeWidth,
	onDeleteAll,
	disabled,
}: ToolbarProps) => {
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
	const [strokeRef, setStrokeRef] = useState<HTMLButtonElement>();
	const [strokeWidth, setStrokeWidth] = useState(4);
	const [colorPickerRef, setColorPickerRef] = useState<HTMLButtonElement>();

	useEffect(() => {
		if (onPopoverStateChange) {
			onPopoverStateChange(isPopoverOpen || isColorPickerOpen);
		}
	}, [isPopoverOpen, onPopoverStateChange, isColorPickerOpen]);

	const onChangeWrapper = (color: string) => () => {
		onColorChange(color);
	};

	const swcSize = scale(strokeWidth, 1, 30, 0.2, 2);

	return (
		<Toolbar>
			{colors.map((v) => {
				return (
					<Button
						className="circle"
						onClick={onChangeWrapper(v)}
						key={`color-${v}`}
						style={{ backgroundColor: v, borderColor: v === currentlyActive ? 'blue' : 'black', opacity: v === currentlyActive ? '100%' : '70%' }}
						disabled={disabled}
					/>
				);
			})}
			<IconButton onClick={() => setIsColorPickerOpen(!isColorPickerOpen)} ref={(ref) => setColorPickerRef(ref!)} disabled={disabled}>
				<FaEyeDropper />
			</IconButton>
			<div style={{ marginLeft: 'auto' }}>
				<Button onClick={() => setIsPopoverOpen(!isPopoverOpen)} ref={(ref) => setStrokeRef(ref!)} disabled={disabled}>
					<div className="stroke-circle-wrapper" style={{ width: '2rem', height: '2rem' }}>
						<div className="stroke-circle" style={{ width: `${swcSize}rem`, height: `${swcSize}rem` }} />
					</div>
				</Button>
				<IconButton onClick={onChangeWrapper('eraser')} disabled={disabled}>
					<FaEraser color={currentlyActive === 'eraser' ? 'black' : 'gray'} />
				</IconButton>
				<IconButton onClick={onChangeWrapper('magic-eraser')} disabled={disabled}>
					<FaMagic color={currentlyActive === 'magic-eraser' ? 'black' : 'gray'} />
				</IconButton>
				{onDeleteAll && (
					<IconButton onClick={() => onDeleteAll()} disabled={disabled}>
						<FaTrash color="red" />
					</IconButton>
				)}
			</div>
			<Popover
				open={isPopoverOpen && !disabled}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'center',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'center',
				}}
				anchorEl={strokeRef}
				onClose={() => setIsPopoverOpen(false)}>
				<div className="popover">
					<p>Stroke Width: {strokeWidth}</p>
					<Slider
						aria-label="Stroke Width"
						defaultValue={initialStrokeWidth || 4}
						min={1}
						max={30}
						value={strokeWidth}
						onChange={(_, v) => setStrokeWidth(v as number)}
						onChangeCommitted={(_, v) => onStrokeWidthChanged(v as number)}
					/>
				</div>
			</Popover>
			<ColorPicker
				isOpen={isColorPickerOpen}
				defaultColor={currentlyActive}
				onClose={(color) => {
					onColorChange(color);
					setIsColorPickerOpen(false);
				}}
				anchorEl={colorPickerRef}
			/>
		</Toolbar>
	);
};
export default CustomToolbar;

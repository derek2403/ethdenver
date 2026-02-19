import React from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

interface AnimatedCounterProps {
    value: number;
    format?: (n: number) => string;
    duration?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    format = (n) => n.toString(),
    duration = 0.8,
}) => {
    const motionValue = useMotionValue(0);
    const [displayValue, setDisplayValue] = React.useState(format(0));

    React.useEffect(() => {
        const controls = animate(motionValue, value, {
            duration,
            ease: 'easeOut',
            onUpdate: (latest) => setDisplayValue(format(latest)),
        });
        return controls.stop;
    }, [value, duration, format, motionValue]);

    return (
        <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {displayValue}
        </motion.span>
    );
};

export default AnimatedCounter;

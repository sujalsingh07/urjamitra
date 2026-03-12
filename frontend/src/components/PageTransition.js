import { motion } from 'framer-motion';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 8,
        scale: 0.96 // Start slightly smaller
    },
    in: {
        opacity: 1,
        y: 0,
        scale: 1, // Settle at normal size
        transition: {
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1]
        }
    },
    out: {
        opacity: 0,
        y: -12,
        scale: 1.04, // Pop OUTwards seamlessly
        transition: {
            duration: 0.2,
            ease: "easeIn"
        }
    }
};

export default function PageTransition({ children }) {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            style={{ width: '100%', height: '100%', overflowX: 'hidden' }}
        >
            {children}
        </motion.div>
    );
}

/* eslint-disable no-unused-vars */
import { motion } from 'framer-motion';
const FeatureCard = ({ icon: Icon, title, description, index = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group p-8 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer backdrop-blur-sm"
    >
      <div className="w-14 h-14 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl mb-6 group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/30 transition-all duration-300">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;

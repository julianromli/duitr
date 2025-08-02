import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { WordRotate } from "@/components/magicui/word-rotate";
import { Squares } from "@/components/ui/squares-background";
import { IphoneCarousel } from "@/components/ui/iphone-carousel";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const Hero195 = () => {
  const { t } = useTranslation();
  
  return (
    <div className="w-full relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Animated Grid Background */}
        {/* <Squares
          direction="diagonal"
          speed={0.5}
          borderColor="rgba(34, 197, 94, 0.3)"
          squareSize={40}
          hoverFillColor="rgba(163, 230, 53, 0.2)"
          className="absolute inset-0 -z-10 opacity-60"
        /> */}
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div 
              className="mb-8 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="relative rounded-full px-4 py-2 text-sm leading-6 text-gray-300 ring-1 ring-white/10 hover:ring-white/20 bg-white/5 backdrop-blur-sm">
                {t('landing.hero.badge')}{" "}
                <a href="/login" className="font-semibold text-lime-400 hover:text-lime-300">
                  <span className="absolute inset-0" aria-hidden="true" />
                  {t('landing.hero.badgeAction')} <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-5xl font-bold tracking-tight text-white sm:text-7xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('landing.hero.title')}{" "}
              <br></br>
              <WordRotate 
                words={t('landing.hero.titleHighlight', { returnObjects: true }) as string[]}
                duration={2500}
                className="inline"
              />
            </motion.h1>
            
            <motion.p 
              className="mt-6 text-lg leading-8 text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {t('landing.hero.subtitle')}
            </motion.p>
            
            <motion.div 
              className="mt-10 flex items-center justify-center gap-x-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button 
                size="lg" 
                className="bg-lime-400 hover:bg-lime-500 text-black font-semibold shadow-lg shadow-lime-400/25"
                onClick={() => window.location.href = '/login'}
              >
                {t('landing.hero.cta')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
          {/* Hero Image/Demo */}
          <motion.div
            className="mt-16 flow-root sm:mt-24"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="flex justify-center">
              <IphoneCarousel className="" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <TracingBeam className="px-6">
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div 
              className="mx-auto max-w-2xl text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="text-base font-semibold leading-7 text-lime-400">
                {t('landing.features.title')}
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t('landing.features.subtitle')}
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                {t('landing.features.description')}
              </p>
            </motion.div>
            
            <motion.div 
              className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-8 lg:max-w-none lg:grid-cols-3">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true, margin: "-50px" }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-x-3 text-white">
                        <TrendingUp className="h-5 w-5 flex-none text-lime-400" />
                        {t('landing.features.smartAnalytics.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">
                        {t('landing.features.smartAnalytics.description')}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true, margin: "-50px" }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-x-3 text-white">
                        <Shield className="h-5 w-5 flex-none text-lime-400" />
                        {t('landing.features.securePrivate.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">
                        {t('landing.features.securePrivate.description')}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true, margin: "-50px" }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-x-3 text-white">
                        <Zap className="h-5 w-5 flex-none text-lime-400" />
                        {t('landing.features.realtimeSync.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">
                        {t('landing.features.realtimeSync.description')}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/5 border-white/10">
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-lime-400 data-[state=active]:text-black text-gray-300">{t('landing.tabs.analytics.title')}</TabsTrigger>
                  <TabsTrigger value="budgeting" className="data-[state=active]:bg-lime-400 data-[state=active]:text-black text-gray-300">{t('landing.tabs.budgeting.title')}</TabsTrigger>
                  <TabsTrigger value="tracking" className="data-[state=active]:bg-lime-400 data-[state=active]:text-black text-gray-300">{t('landing.tabs.tracking.title')}</TabsTrigger>
                </TabsList>
              
              <TabsContent value="analytics" className="mt-8">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">{t('landing.tabs.analytics.subtitle')}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {t('landing.tabs.analytics.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 text-lime-400">{t('landing.tabs.analytics.smartRecommendations.title')}</h4>
                        <p className="text-sm text-gray-300">
                          {t('landing.tabs.analytics.smartRecommendations.description')}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-lime-400">{t('landing.tabs.analytics.spendingPatterns.title')}</h4>
                        <p className="text-sm text-gray-300">
                          {t('landing.tabs.analytics.spendingPatterns.description')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="budgeting" className="mt-8">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">{t('landing.tabs.budgeting.subtitle')}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {t('landing.tabs.budgeting.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 text-lime-400">{t('landing.tabs.budgeting.automaticCategorization.title')}</h4>
                        <p className="text-sm text-gray-300">
                          {t('landing.tabs.budgeting.automaticCategorization.description')}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-lime-400">{t('landing.tabs.budgeting.budgetAlerts.title')}</h4>
                        <p className="text-sm text-gray-300">
                          {t('landing.tabs.budgeting.budgetAlerts.description')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tracking" className="mt-8">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">{t('landing.tabs.tracking.subtitle')}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {t('landing.tabs.tracking.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 text-lime-400">{t('landing.tabs.tracking.multiAccount.title')}</h4>
                        <p className="text-sm text-gray-300">
                          {t('landing.tabs.tracking.multiAccount.description')}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-lime-400">{t('landing.tabs.tracking.realTimeUpdates.title')}</h4>
                        <p className="text-sm text-gray-300">
                          {t('landing.tabs.tracking.realTimeUpdates.description')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div 
              className="mx-auto max-w-2xl text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 
                className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                {t('landing.cta.title')}
              </motion.h2>
              <motion.p 
                className="mt-6 text-lg leading-8 text-gray-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                {t('landing.cta.subtitle')}
              </motion.p>
              <motion.div 
                className="mt-10 flex items-center justify-center gap-x-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Button 
                  size="lg" 
                  className="bg-lime-400 hover:bg-lime-500 text-black font-semibold shadow-lg shadow-lime-400/25"
                  onClick={() => window.location.href = '/login'}
                >
                  {t('landing.cta.button')}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </TracingBeam>
    </div>
  );
};

export { Hero195 };
export default Hero195;
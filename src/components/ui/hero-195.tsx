import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BorderBeam } from "@/components/ui/border-beam";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { Typewriter } from "@/components/ui/typewriter-text";
import { ArrowRight, CheckCircle, Star, Users, TrendingUp, Shield, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";

const Hero195 = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
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
                Get started to the future of financial management with Duitr.{" "}
                <a href="/login" className="font-semibold text-lime-400 hover:text-lime-300">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Start now <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Take Control of Your{" "}
              <br></br>
              <span className="bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text text-transparent">
                <Typewriter 
                  text={["Financial Future", "Money Management", "Smart Budgeting"]}
                  speed={120}
                  loop={true}
                  delay={2000}
                  className="inline"
                />
              </span>
            </motion.h1>
            
            <motion.p 
              className="mt-6 text-lg leading-8 text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Meet your smart finance assistant. Analyze spending, manage debts, and budget effortlessly – all powered by AI in one beautiful app.
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
                Get started for free
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
            <div className="-m-2 rounded-xl bg-white/5 p-2 ring-1 ring-inset ring-white/10 lg:-m-4 lg:rounded-2xl lg:p-4 backdrop-blur-sm">
              <Card className="relative overflow-hidden bg-black border-white/10">
                <BorderBeam size={250} duration={12} delay={9} colorFrom="#a3e635" colorTo="#22c55e" />
                <CardContent className="p-0">
                  <img
                    src="/images/iphone-mockup3.png"
                    alt="Duitr App Dashboard"
                    className="w-full h-[400px] object-contain bg-gradient-to-br from-gray-900 to-black"
                  />
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <TracingBeam className="px-6">
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div 
              className="mx-auto max-w-2xl text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="text-base font-semibold leading-7 text-lime-400">
                Everything you need
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Powerful features for modern finance
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                From AI-powered insights to comprehensive tracking, Duitr provides all the tools you need to master your finances.
              </p>
            </motion.div>
            
            <motion.div 
              className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <motion.div 
                  className="flex flex-col"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true, margin: "-50px" }}
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <TrendingUp className="h-5 w-5 flex-none text-lime-400" />
                    Smart Analytics
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                    <p className="flex-auto">
                      AI-powered insights that help you understand your spending patterns and optimize your financial decisions.
                    </p>
                  </dd>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true, margin: "-50px" }}
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <Shield className="h-5 w-5 flex-none text-lime-400" />
                    Secure & Private
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                    <p className="flex-auto">
                      Bank-level security with end-to-end encryption. Your financial data is always protected and private.
                    </p>
                  </dd>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true, margin: "-50px" }}
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <Zap className="h-5 w-5 flex-none text-lime-400" />
                    Real-time Sync
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                    <p className="flex-auto">
                      Instant synchronization across all your devices. Access your financial data anywhere, anytime.
                    </p>
                  </dd>
                </motion.div>
              </dl>
            </motion.div>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/5 border-white/10">
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-lime-400 data-[state=active]:text-black text-gray-300">Analytics</TabsTrigger>
                  <TabsTrigger value="budgeting" className="data-[state=active]:bg-lime-400 data-[state=active]:text-black text-gray-300">Budgeting</TabsTrigger>
                  <TabsTrigger value="tracking" className="data-[state=active]:bg-lime-400 data-[state=active]:text-black text-gray-300">Tracking</TabsTrigger>
                </TabsList>
              
              <TabsContent value="analytics" className="mt-8">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Smart Financial Analytics</CardTitle>
                    <CardDescription className="text-gray-300">
                      Get deep insights into your spending patterns with AI-powered analytics.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 text-lime-400">Spending Categories</h4>
                        <p className="text-sm text-gray-300">
                          Automatically categorize your expenses and see where your money goes.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-lime-400">Trend Analysis</h4>
                        <p className="text-sm text-gray-300">
                          Identify spending trends and get personalized recommendations.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="budgeting" className="mt-8">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Intelligent Budgeting</CardTitle>
                    <CardDescription className="text-gray-300">
                      Create and manage budgets that actually work for your lifestyle.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 text-lime-400">Smart Recommendations</h4>
                        <p className="text-sm text-gray-300">
                          AI suggests optimal budget allocations based on your spending history.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-lime-400">Goal Tracking</h4>
                        <p className="text-sm text-gray-300">
                          Set financial goals and track your progress with visual indicators.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tracking" className="mt-8">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Comprehensive Tracking</CardTitle>
                    <CardDescription className="text-gray-300">
                      Track all your financial activities in one centralized dashboard.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 text-lime-400">Multi-Account Support</h4>
                        <p className="text-sm text-gray-300">
                          Connect multiple bank accounts and credit cards for complete visibility.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-lime-400">Debt Management</h4>
                        <p className="text-sm text-gray-300">
                          Track debts and create payoff strategies to become debt-free faster.
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
        <section className="py-24 sm:py-32">
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
                Ready to transform your finances?
              </motion.h2>
              <motion.p 
                className="mt-6 text-lg leading-8 text-gray-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Join thousands of users who have taken control of their financial future with Duitr.
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
                  Start your free trial
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
-- RLS policies (auth.uid() supported by Neon Data API with Neon Auth JWT)

CREATE POLICY "Users can view accessible categories" ON public.categories FOR SELECT USING ((user_id IS NULL) OR (user_id = (SELECT auth.uid() AS uid)));
CREATE POLICY "Users can create custom categories" ON public.categories FOR INSERT WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (user_id = (SELECT auth.uid() AS uid)) WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (user_id = (SELECT auth.uid() AS uid));

CREATE POLICY "Users can view their own wallets" ON public.wallets FOR SELECT USING (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can insert their own wallets" ON public.wallets FOR INSERT WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can update their own wallets" ON public.wallets FOR UPDATE USING (user_id = (SELECT auth.uid() AS uid)) WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can delete their own wallets" ON public.wallets FOR DELETE USING (user_id = (SELECT auth.uid() AS uid));

CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (user_id = (SELECT auth.uid() AS uid)) WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING (user_id = (SELECT auth.uid() AS uid));

CREATE POLICY "Users can view their own budgets" ON public.budgets FOR SELECT USING (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can insert their own budgets" ON public.budgets FOR INSERT WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE USING (user_id = (SELECT auth.uid() AS uid)) WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE USING (user_id = (SELECT auth.uid() AS uid));

CREATE POLICY "Exchange rates are viewable by everyone" ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "Exchange rates are insertable by authenticated users" ON public.exchange_rates FOR INSERT WITH CHECK ((SELECT auth.uid() AS uid) IS NOT NULL);
CREATE POLICY "Exchange rates are updatable by authenticated users" ON public.exchange_rates FOR UPDATE USING ((SELECT auth.uid() AS uid) IS NOT NULL) WITH CHECK ((SELECT auth.uid() AS uid) IS NOT NULL);

CREATE POLICY "Users can view their own pinjaman items" ON public.pinjaman_items FOR SELECT USING (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can insert their own pinjaman items" ON public.pinjaman_items FOR INSERT WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can update their own pinjaman items" ON public.pinjaman_items FOR UPDATE USING (user_id = (SELECT auth.uid() AS uid)) WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can delete their own pinjaman items" ON public.pinjaman_items FOR DELETE USING (user_id = (SELECT auth.uid() AS uid));

CREATE POLICY "Users can view their own want to buy items" ON public.want_to_buy_items FOR SELECT USING (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can insert their own want to buy items" ON public.want_to_buy_items FOR INSERT WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can update their own want to buy items" ON public.want_to_buy_items FOR UPDATE USING (user_id = (SELECT auth.uid() AS uid)) WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can delete their own want to buy items" ON public.want_to_buy_items FOR DELETE USING (user_id = (SELECT auth.uid() AS uid));

CREATE POLICY "Users can view own subscriptions" ON public.notification_subscriptions FOR SELECT USING ((SELECT auth.uid() AS uid) = user_id);
CREATE POLICY "Users can create own subscriptions" ON public.notification_subscriptions FOR INSERT WITH CHECK ((SELECT auth.uid() AS uid) = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.notification_subscriptions FOR UPDATE USING ((SELECT auth.uid() AS uid) = user_id);
CREATE POLICY "Users can delete own subscriptions" ON public.notification_subscriptions FOR DELETE USING ((SELECT auth.uid() AS uid) = user_id);
CREATE POLICY "Service role can access all subscriptions" ON public.notification_subscriptions FOR ALL USING ((SELECT auth.role() AS role) = 'service_role'::text);

CREATE POLICY "Users can view own predictions" ON public.budget_predictions FOR SELECT USING ((SELECT auth.uid() AS uid) = user_id);
CREATE POLICY "Users can update own predictions" ON public.budget_predictions FOR UPDATE USING ((SELECT auth.uid() AS uid) = user_id);
CREATE POLICY "Users can delete own predictions" ON public.budget_predictions FOR DELETE USING ((SELECT auth.uid() AS uid) = user_id);
CREATE POLICY "System can insert predictions" ON public.budget_predictions FOR INSERT WITH CHECK (((SELECT auth.uid() AS uid) = user_id) OR ((SELECT auth.role() AS role) = 'service_role'::text));

CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (user_id = (SELECT auth.uid() AS uid)) WITH CHECK (user_id = (SELECT auth.uid() AS uid));

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

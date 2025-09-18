ALTER TABLE guest_tokens
ADD CONSTRAINT unique_guest_token UNIQUE (token);
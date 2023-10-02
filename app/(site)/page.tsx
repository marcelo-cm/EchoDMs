"use client";

import Image from "next/image";
import "@radix-ui/themes/styles.css";
import {
  Text,
  Card,
  Flex,
  Avatar,
  Box,
  Heading,
  TextField,
  IconButton,
  Button,
} from "@radix-ui/themes";
import {
  LockClosedIcon,
  PaperPlaneIcon,
  PersonIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import supabase from "../../supabaseClient";
import * as Form from "@radix-ui/react-form";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";

export default function Home() {
  const [hasAccount, setHasAccount] = useState(true);
  const [formDetails, setFormDetails] = useState({ email: "", password: "" });
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const user = await supabase.auth.getUser();
      const session = await supabase.auth.getSession();
      if (user.data.user?.id != null) {
        console.log("User is logged in");
        localStorage.setItem(
          "token",
          session.data.session?.access_token as string
        );
        localStorage.setItem("user", user.data.user?.id as string);
        console.log("User is logged in");
        router.push("/dashboard");
      }
    }
    checkUser();
  }, [router]);

  const updateForm = (e: any) => {
    console.log(e.target.name, e.target.value);
    setFormDetails((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const signInAccount = async () => {
    const { email, password } = formDetails;

    if (!email || !password) {
      console.error("Email or password missing!");
      return;
    }

    const { data: user, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Error signing into account:", error.message);
      return;
    }

    console.log("Account signed in successfully:", user);
    router.push("/dashboard");
  };

  const createNewAccount = async () => {
    const { email, password } = formDetails;

    if (!email || !password) {
      console.error("Email or password missing!");
      return;
    }

    const { data: user, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    const { data: userId, error: error2 } = await supabase
      .from("users")
      .insert([{ email: email, password: password }])
      .select("id");

    if (error2) {
      console.error("Error creating account:", error2.message);
      if (error2.message.includes("duplicate")) {
        setDialogOpen(true);
      }
      return;
    }

    console.log("Account created successfully:", user);
  };

  return (
    <main className="flex min-h-screen bg-slate-200 flex-col items-center justify-between p-24">
      <Flex gap="3" direction="column">
        <Card variant="classic" size="2" style={{ width: 425 }}>
          <Flex justify="between" align="center">
            <Flex gap="4" align="center">
              <Avatar size="4" radius="full" fallback="M" color="indigo" />
              <Box>
                <Text as="div" weight="bold">
                  Marcelo Chaman Mallqui
                </Text>
                <Text as="div" color="gray">
                  Founder
                </Text>
              </Box>
            </Flex>
            <a href="mailto:marcechaman@gmail.com">
              <Button>
                <Flex direction="row" align="center" gap="2">
                  <Text>Contact</Text>
                  <PaperPlaneIcon />
                </Flex>
              </Button>
            </a>
          </Flex>
        </Card>
        <Card variant="classic" size="4" style={{ width: 425 }}>
          <Flex direction="column" gap="4">
            <Heading mb="2" size="6">
              Sign In
            </Heading>
            <Form.Root>
              <Flex direction="column" gap="4">
                <Form.Field name="email">
                  <Flex direction="column" gap="1">
                    <Flex gap="1">
                      <TextField.Slot>
                        <PersonIcon />
                      </TextField.Slot>
                      <Form.Label>Account Email</Form.Label>
                    </Flex>
                    <Form.Control asChild>
                      <TextField.Input
                        type="email"
                        onChange={(e) => updateForm(e)}
                        placeholder="marcelo@echodm.ca"
                        size="3"
                      />
                    </Form.Control>
                    {/* <Form.Message /> */}
                  </Flex>
                </Form.Field>
                <Form.Field name="password">
                  <Flex direction="column" gap="1">
                    <Flex gap="1">
                      <TextField.Slot>
                        <PersonIcon />
                      </TextField.Slot>
                      <Form.Label>Password</Form.Label>
                    </Flex>
                    <Form.Control asChild>
                      <TextField.Input
                        type="password"
                        onChange={(e) => updateForm(e)}
                        placeholder="password"
                        size="3"
                      />
                    </Form.Control>
                    {/* <Form.Message /> */}
                  </Flex>
                </Form.Field>
                <Flex gap="4" direction="column" className="self-center">
                  <Form.Submit asChild>
                    <Button
                      type="submit"
                      size="3"
                      onClick={(e) => {
                        e.preventDefault();
                        signInAccount();
                      }}
                    >
                      Sign In
                    </Button>
                  </Form.Submit>
                  <Form.Submit asChild>
                    <Button
                      variant="soft"
                      size="3"
                      onClick={(e) => {
                        e.preventDefault();
                        createNewAccount();
                      }}
                    >
                      {hasAccount
                        ? "Create an account"
                        : "Have an account? Log In!"}
                    </Button>
                  </Form.Submit>
                </Flex>
                <a
                  href="https://slack.com/openid/connect/authorize?scope=openid%20email%20profile&amp;response_type=code&amp;redirect_uri=https%3A%2F%2Fwww.marcelochaman.ca%2F&amp;client_id=2296686343921.5959455796519"
                  style={{
                    alignItems: "center",
                    color: "#000",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    display: "inline-flex",
                    fontFamily: "Lato, sans-serif",
                    fontSize: "16px",
                    fontWeight: "600",
                    height: "48px",
                    justifyContent: "center",
                    textDecoration: "none",
                    width: "256px",
                    alignSelf: "center",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      height: "20px",
                      width: "20px",
                      marginRight: "12px",
                    }}
                    viewBox="0 0 122.8 122.8"
                  >
                    <path
                      d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z"
                      fill="#e01e5a"
                    ></path>
                    <path
                      d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z"
                      fill="#36c5f0"
                    ></path>
                    <path
                      d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z"
                      fill="#2eb67d"
                    ></path>
                    <path
                      d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z"
                      fill="#ecb22e"
                    ></path>
                  </svg>
                  Sign in with Slack
                </a>
                <Form.Submit />
              </Flex>
            </Form.Root>
          </Flex>
        </Card>
        <Dialog.Root open={dialogOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="bg-black/25 data-[state=open]:animate-overlayShow fixed inset-0" />
            <Dialog.Content className="text-black data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
              <Dialog.Title className="m-0 text-[17px] font-medium">
                Account Already Exists With This Email
              </Dialog.Title>
              <Dialog.Description className="mt-[10px] mb-5 text-[15px] leading-normal">
                Sign in with your email and password to continue.
              </Dialog.Description>
              <Dialog.Close
                asChild
                onClick={() => setDialogOpen((prevState) => !prevState)}
              >
                <button
                  className=" absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                  aria-label="Close"
                >
                  <Cross2Icon />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </Flex>
    </main>
  );
}

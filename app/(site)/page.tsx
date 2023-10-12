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
  AlertDialog,
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
  const [formDetails, setFormDetails] = useState({
    email: "",
    password: "",
    name: "",
  });
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [logInDialogOpen, setLogInDialogOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data, error } = await supabase.auth.getSession();

    if (!error && data.session) {
      router.push("/dashboard");
    } else {
      console.log("No active session");
    }
  }

  const updateForm = (e: any) => {
    // console.log(e.target.name, e.target.value);
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

      if (error.message.includes("Invalid")) {
        setLogInDialogOpen(true);
      }
      return;
    }

    console.log("Account signed in successfully:", user);
    router.push("/dashboard");
  };

  const createNewAccount = async () => {
    const { email, password, name } = formDetails;

    if (!email || !password || !name) {
      console.error("Email, password or name missing!");
      return;
    }

    const { data: user, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    console.log(user);

    if (signUpError) {
      console.error("Error signing up:", signUpError.message);
      return;
    }

    const { data: userId, error: error2 } = await supabase
      .from("users")
      .insert([
        { email: email, password: password, id: user.user?.id, name: name },
      ])
      .select("id");

    if (error2) {
      console.error("Error creating account:", error2.message);
      if (error2.message.includes("already")) {
        setCreateDialogOpen(true);
      }
      return;
    }

    console.log("Account created successfully:", user);
    router.push("/dashboard");
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
              </Flex>
            </Form.Root>
          </Flex>
        </Card>
        <AlertDialog.Root open={logInDialogOpen}>
          <AlertDialog.Content style={{ maxWidth: 450 }}>
            <Flex direction="column">
              <AlertDialog.Title>
                Account Does Not Exist, or Incorrect Password
              </AlertDialog.Title>
              <AlertDialog.Description size="2">
                An account with this email does not exist. Please try logging in
                with another password or create an account. If this issue
                persists, contact us at marcechaman@gmail.com
              </AlertDialog.Description>
              <Button
                onClick={() => setLogInDialogOpen((prevState) => !prevState)}
                mt="2"
                variant="solid"
                className="w-fit self-end"
              >
                Got it!
              </Button>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
        <AlertDialog.Root open={createDialogOpen}>
          <AlertDialog.Content style={{ maxWidth: 450 }}>
            <Flex direction="column">
              <AlertDialog.Title>Account Already Exists</AlertDialog.Title>
              <AlertDialog.Description size="2">
                An account with this email already exists. Please try logging
                in, otherwise contact us at marcechaman@gmail.com
              </AlertDialog.Description>
              <Button
                onClick={() => setCreateDialogOpen((prevState) => !prevState)}
                mt="2"
                variant="solid"
                className="w-fit self-end"
              >
                Got it!
              </Button>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </Flex>
    </main>
  );
}

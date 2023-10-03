"use client";

import supabase from "@/supabaseClient";
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
  Table,
  AlertDialog,
  Dialog,
  Callout,
} from "@radix-ui/themes";
import {
  InfoCircledIcon,
  LockClosedIcon,
  PaperPlaneIcon,
  PersonIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useState } from "react";
import "../globals.css";

const Dashboard = () => {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userServers, setUserServers] = useState<String[]>([]);

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
      } else {
        router.push("/");
      }
    }
    checkUser();
  }, [router]);

  useEffect(() => {
    getUserServers();
  }, []);

  const getUserServers = async () => {
    console.log(localStorage.getItem("user"));
    const { data, error } = await supabase
      .from("server_users")
      .select("server_id")
      .eq("user_id", localStorage.getItem("user"));

    // console.log(data, error);

    if (!error) {
      setUserServers(data.map((element) => element.server_id));
    } else {
      console.log(error);
    }
  };

  const getServerUsers = async () => {
    console.log(localStorage.getItem("user"));
    const { data, error } = await supabase
      .from("server_users")
      .select("user_id")
      .eq("user_id", localStorage.getItem("user"));

    // console.log(data, error);

    if (!error) {
      // updateServerUsers(data.map((element) => element.server_id));
    } else {
      console.log(error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/");
    }
  };

  const deleteUser = async (id: string | null) => {
    if (id) {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id)
        .single();
      if (!error) {
        setIsDeleteOpen(false);
      }
      if (error) {
        console.log(error);
        setIsDeleteOpen(false);
      }
    }
  };

  return (
    <main className="flex min-h-screen bg-slate-200 flex-col items-center justify-between p-24">
      {/* Founder Contact Card */}
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
      <Card variant="classic" size="3" className="w-1/2">
        <Flex justify="between">
          <Heading mb="4" size="6">
            Servers & Users
          </Heading>
          <Button>
            Add User
            <PlusIcon />
          </Button>
        </Flex>
        <div>{String(userServers)}</div>
        <Flex direction="column" gap="4">
          <Box mt="2">
            <Heading size="4">
              <Flex gap="2" align="center">
                <Avatar fallback="1" />
                Server #1
              </Flex>
            </Heading>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Echo DMs Sent</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.RowHeaderCell>
                    <Flex gap="2" align="center">
                      <Avatar
                        size="2"
                        radius="full"
                        fallback="M"
                        color="indigo"
                      />
                      Marcelo Chaman Mallqui
                    </Flex>
                  </Table.RowHeaderCell>
                  <Table.Cell>
                    <Flex gap="2" height="100%" align="center">
                      123
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2" height="100%" align="center">
                      <Dialog.Root>
                        <Dialog.Trigger>
                          <Button size="2">Edit User</Button>
                        </Dialog.Trigger>
                        <Dialog.Content style={{ maxWidth: 450 }}>
                          <Dialog.Title>Edit profile</Dialog.Title>
                          <Dialog.Description size="2" mb="4">
                            Make changes to your profile.
                          </Dialog.Description>

                          <Flex direction="column" gap="3">
                            <label>
                              <Text as="div" size="2" mb="1" weight="bold">
                                Name
                              </Text>
                              <TextField.Input
                                defaultValue="Freja Johnsen"
                                placeholder="Enter your full name"
                              />
                            </label>
                            <label>
                              <Text as="div" size="2" mb="1" weight="bold">
                                User OAuth Token
                              </Text>
                              <TextField.Input
                                defaultValue="12345"
                                placeholder="Enter your email"
                              />
                            </label>
                            <label>
                              <Text as="div" size="2" mb="1" weight="bold">
                                Proxy Password <em>(Optional)</em>
                              </Text>
                              <TextField.Input
                                defaultValue="12345"
                                placeholder="Enter your email"
                              />
                            </label>
                            <Box>
                              <Callout.Root>
                                <Callout.Icon>
                                  <InfoCircledIcon />
                                </Callout.Icon>
                                <Callout.Text>
                                  Proxy passwords allow others to send DMs on
                                  your behalf.
                                </Callout.Text>
                              </Callout.Root>
                            </Box>
                          </Flex>
                          <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                              <Button variant="soft" color="gray">
                                Cancel
                              </Button>
                            </Dialog.Close>
                            <Dialog.Close>
                              <Button>Save</Button>
                            </Dialog.Close>
                          </Flex>
                        </Dialog.Content>
                      </Dialog.Root>
                      <AlertDialog.Root>
                        <AlertDialog.Trigger>
                          <Button size="2" color="red">
                            Delete
                          </Button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Content style={{ maxWidth: 450 }}>
                          <Flex direction="column">
                            <AlertDialog.Title>Are you sure?</AlertDialog.Title>
                            <AlertDialog.Description size="2">
                              If you delete this user, they will have to sign in
                              again to use this app.
                            </AlertDialog.Description>
                            <Flex gap="3" mt="4" justify="end">
                              <AlertDialog.Cancel>
                                <Button variant="soft" color="gray">
                                  Cancel
                                </Button>
                              </AlertDialog.Cancel>
                              <AlertDialog.Action>
                                <Button
                                  variant="solid"
                                  color="red"
                                  onClick={() => deleteUser("id")}
                                >
                                  Delete User
                                </Button>
                              </AlertDialog.Action>
                            </Flex>
                          </Flex>
                        </AlertDialog.Content>
                      </AlertDialog.Root>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
          </Box>
        </Flex>
      </Card>
      <Card>
        - add servers <br />- server ID - what info can i pull using slack api
        by just having the server id? <br />- ‘add users’ screen [edit info
        dialog] <br />
        – can i get the list of users from slack api? <br />- name <br />- oauth
        key <br />- proxy password (optional)
      </Card>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </main>
  );
};

export default Dashboard;

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
import { Server } from "http";

const Dashboard = () => {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userServers, setUserServers] = useState<String[]>([]);
  const [serverUserMap, setServerUserMap] = useState<{
    [key: string]: string[];
  }>({});
  const [serverInfoDict, setServerInfoDict] = useState<{
    [key: string]: string[];
  }>({ key: ["value"] });
  const [userInfoDict, setUserInfoDict] = useState<{
    [user: string]: { name: string; echos_sent: number };
  }>({ placeholder: { name: "", echos_sent: 1 } });

  useEffect(() => {
    async function checkUser() {
      const user = await supabase.auth.getUser();
      const session = await supabase.auth.getSession();
      if (user.data.user?.id != null) {
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
  }, []);

  useEffect(() => {
    getUserServers();
  }, []);

  const getUserServers = async () => {
    const { data, error } = await supabase
      .from("server_users")
      .select("server_id")
      .eq("user_id", localStorage.getItem("user"));

    console.log("getUserServers: ", data, error);

    if (!error) {
      setUserServers(data.map((element) => element.server_id));
    } else {
      console.log(error);
    }
  };

  const getServerInfo = async () => {
    const { data, error } = await supabase
      .from("servers")
      .select("id, server_name")
      .in("id", userServers);

    console.log("getServerInfo: ", data, error);

    if (!error) {
      setServerInfoDict((prevState) => {
        return data.reduce(
          (acc, element) => {
            acc[element.id] = element.server_name;
            return acc;
          },
          { ...prevState }
        );
      });
    } else {
      console.log(error);
    }
  };

  const [allUsers, setAllUsers] = useState<string[]>([]);

  const getUserInfo = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, echos_sent")
      .in("id", allUsers);

    console.log("getUserInfo: ", data, error);

    if (!error) {
      setUserInfoDict((prevState) => {
        return data.reduce(
          (acc, element) => {
            acc[element.id] = {
              name: element.name,
              echos_sent: element.echos_sent,
            };
            return acc;
          },
          { ...prevState }
        );
      });
    } else {
      console.log(error);
    }
  };

  useEffect(() => {
    if (allUsers.length > 0) {
      getUserInfo();
    }
  }, [allUsers]);

  useEffect(() => {
    if (userServers.length > 0) {
      getServerUsers();
      getServerInfo();
    }
  }, [userServers]);

  const getServerUsers = async () => {
    const { data, error } = await supabase
      .from("server_users")
      .select("user_id, server_id")
      .in("server_id", userServers);

    console.log("getServerUsers: ", data, error);

    if (!error) {
      mapServerUsers(data);
      setAllUsers(Array.from(new Set(data.map((item) => item.user_id))));
    } else {
      console.log(error);
    }
  };

  const mapServerUsers = (
    data: {
      user_id: string;
      server_id: string;
    }[]
  ) => {
    const mapping: { [key: string]: string[] } = data.reduce(
      (
        acc: { [key: string]: string[] },
        record: { server_id: string; user_id: string }
      ) => {
        if (!acc[record.server_id]) {
          acc[record.server_id] = [];
        }
        acc[record.server_id].push(record.user_id);

        return acc;
      },
      {}
    );

    setServerUserMap(mapping);
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
        {/* <div>{String(userServers)}</div>
        <pre>{JSON.stringify(serverUserMap, null, 2)}</pre> */}
        <Box mt="2">
          <Flex direction="column" gap="4">
            {Object.keys(serverUserMap)?.map((server, key) => (
              <Heading size="4" key={key}>
                <Flex gap="2" align="center">
                  <Avatar fallback={serverInfoDict[server][0]} />
                  {serverInfoDict[server]}
                </Flex>
                <Table.Root mb="4">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>
                        Echo DMs Sent
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell />
                    </Table.Row>
                  </Table.Header>
                  {serverUserMap[server]?.map((user, key) => (
                    <Table.Body key={key}>
                      <Table.Row>
                        <Table.RowHeaderCell>
                          <Flex gap="2" align="center">
                            <Avatar
                              size="2"
                              radius="full"
                              fallback={userInfoDict[user]?.name[0]}
                              color="indigo"
                            />
                            {userInfoDict[user]?.name}
                          </Flex>
                        </Table.RowHeaderCell>
                        <Table.Cell>
                          <Flex gap="2" height="100%" align="center">
                            {userInfoDict[user]?.echos_sent}
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
                                    <Text
                                      as="div"
                                      size="2"
                                      mb="1"
                                      weight="bold"
                                    >
                                      Name
                                    </Text>
                                    <TextField.Input
                                      defaultValue="Freja Johnsen"
                                      placeholder="Enter your full name"
                                    />
                                  </label>
                                  <label>
                                    <Text
                                      as="div"
                                      size="2"
                                      mb="1"
                                      weight="bold"
                                    >
                                      User OAuth Token
                                    </Text>
                                    <TextField.Input
                                      defaultValue="12345"
                                      placeholder="Enter your email"
                                    />
                                  </label>
                                  <label>
                                    <Text
                                      as="div"
                                      size="2"
                                      mb="1"
                                      weight="bold"
                                    >
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
                                        Proxy passwords allow others to send DMs
                                        on your behalf.
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
                                  <AlertDialog.Title>
                                    Are you sure?
                                  </AlertDialog.Title>
                                  <AlertDialog.Description size="2">
                                    If you delete this user, they will have to
                                    sign in again to use this app.
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
                  ))}
                </Table.Root>
              </Heading>
            ))}
          </Flex>
        </Box>
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
